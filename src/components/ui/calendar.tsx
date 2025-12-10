"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react-v1";
import { DayPicker } from "react-day-picker-v1";
import "./calendar.css";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <div className="custom-calendar">
      <DayPicker
        showOutsideDays={showOutsideDays}
        components={{
          IconLeft: (props) => (
            <ChevronLeft {...props} />
          ),
          IconRight: (props) => (
            <ChevronRight {...props} />
          ),
        }}
        {...props}
      />
    </div>
  );
}

export { Calendar };
