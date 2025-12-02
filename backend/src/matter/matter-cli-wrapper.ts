#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Adapted from matter.js/packages/examples/src/controller/ControllerNode.ts
 * Modified for IPC communication via stdin/stdout
 */

import { Diagnostic, Environment, Logger, StorageService, Time } from "@matter/main";
import { GeneralCommissioning } from "@matter/main/clusters";
import { ManualPairingCodeCodec, NodeId } from "@matter/main/types";
import { CommissioningController, NodeCommissioningOptions } from "@project-chip/matter.js";

// Configure Logger to output to stderr to keep stdout clean for IPC
if (Logger.destinations && Logger.destinations.default) {
    Logger.destinations.default.write = (text) => process.stderr.write(text + '\n');
}
const logger = Logger.get("IPCController");

// Setup environment and storage
const environment = Environment.default;
const storageService = environment.get(StorageService);

// Message types
interface CommissionMessage {
    type: 'commission';
    pairingCode: string;
}

interface ControlMessage {
    type: 'control';
    deviceId: string;
    command: string;
}

type IncomingMessage = CommissionMessage | ControlMessage;

let commissioningController: CommissioningController | null = null;

async function initializeController() {
    try {
        logger.info('Initializing Matter controller via IPC...');

        // Setup storage (as in the example)
        const controllerStorage = (await storageService.open("controller")).createContext("data");

        // Generate unique ID
        const uniqueId = (await controllerStorage.has("uniqueid"))
            ? await controllerStorage.get<string>("uniqueid")
            : Time.nowMs().toString();
        await controllerStorage.set("uniqueid", uniqueId);

        const adminFabricLabel = (await controllerStorage.has("fabriclabel"))
            ? await controllerStorage.get<string>("fabriclabel")
            : "KineSave Controller";
        await controllerStorage.set("fabriclabel", adminFabricLabel);

        // Create CommissioningController (exactly as in the example)
        commissioningController = new CommissioningController({
            environment: {
                environment,
                id: uniqueId,
            },
            autoConnect: false,
            adminFabricLabel,
        });

        // Start the controller
        await commissioningController.start();

        logger.info('Matter controller initialized successfully');
        sendMessage({ type: 'ready' });

    } catch (error: any) {
        logger.error(`Initialization error: ${error.message}`);
        sendMessage({ type: 'error', message: error.message });
        process.exit(1);
    }
}

async function handleCommission(pairingCode: string) {
    try {
        logger.info(`Commissioning device with pairing code: ${pairingCode}`);

        if (!commissioningController) {
            throw new Error('Controller not initialized');
        }

        // Decode pairing code (as in the example)
        const pairingCodeData = ManualPairingCodeCodec.decode(pairingCode);
        const shortDiscriminator = pairingCodeData.shortDiscriminator;
        const setupPin = pairingCodeData.passcode;

        logger.debug(`Decoded pairing code: ${Diagnostic.json(pairingCodeData)}`);

        // Setup commissioning options (as in the example)
        const commissioningOptions: NodeCommissioningOptions["commissioning"] = {
            regulatoryLocation: GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
            regulatoryCountryCode: "XX",
        };

        const options: NodeCommissioningOptions = {
            commissioning: commissioningOptions,
            discovery: {
                identifierData: {
                    shortDiscriminator
                },
                discoveryCapabilities: {
                    ble: false, // Disable BLE for simplicity
                },
            },
            passcode: setupPin,
        };

        logger.info(`Commissioning with options: ${Diagnostic.json(options)}`);

        // Commission the node (exactly as in the example)
        const nodeId = await commissioningController.commissionNode(options);

        logger.info(`Successfully commissioned device with Node ID: ${nodeId}`);

        sendMessage({
            type: 'commissionSuccess',
            deviceId: nodeId.toString(),
            deviceInfo: {
                nodeId: nodeId,
                discriminator: shortDiscriminator,
            },
        });

    } catch (error: any) {
        logger.error(`Commission error: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
        sendMessage({ type: 'error', message: error.message });
    }
}

function sendMessage(message: any) {
    process.stdout.write(JSON.stringify(message) + '\n');
}

// Handle incoming messages from parent process
let buffer = '';

process.stdin.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
        if (!line.trim()) continue;

        try {
            const message: IncomingMessage = JSON.parse(line);
            logger.debug(`Received message: ${message.type}`);

            switch (message.type) {
                case 'commission':
                    handleCommission(message.pairingCode);
                    break;
                case 'control':
                    logger.info(`Control command for device ${message.deviceId}: ${message.command}`);
                    sendMessage({ type: 'error', message: 'Control not yet implemented' });
                    break;
                default:
                    logger.warn(`Unknown message type: ${(message as any).type}`);
            }
        } catch (error: any) {
            logger.error(`Parse error: ${error.message}`);
        }
    }
});

process.stdin.on('end', () => {
    logger.info('Parent process disconnected, exiting...');
    cleanup();
});

// Handle errors
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message}`);
    sendMessage({ type: 'error', message: error.message });
});

process.on('unhandledRejection', (reason: any) => {
    logger.error(`Unhandled rejection: ${reason?.message || reason}`);
    sendMessage({ type: 'error', message: reason?.message || String(reason) });
});

// Cleanup on exit
async function cleanup() {
    if (commissioningController) {
        try {
            await commissioningController.close();
            logger.info('Controller closed');
        } catch (error: any) {
            logger.error(`Error closing controller: ${error.message}`);
        }
    }
    process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the controller
initializeController();
