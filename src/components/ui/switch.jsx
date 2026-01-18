import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef(
  (
    {
      className,
      containerClassName,
      labelOn = "Ligado",
      labelOff = "Desligado",
      labelPosition = "side",
      showStateLabel = true,
      checked,
      defaultChecked,
      onCheckedChange,
      ...props
    },
    ref
  ) => {
    const [isChecked, setIsChecked] = React.useState(() => checked ?? defaultChecked ?? false)

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])

    const handleCheckedChange = React.useCallback(
      (state) => {
        setIsChecked(state)
        onCheckedChange?.(state)
      },
      [onCheckedChange]
    )

    const labelNode = showStateLabel ? (
      <span
        aria-live="polite"
        className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {isChecked ? labelOn : labelOff}
      </span>
    ) : null

    return (
      <div
        className={cn(
          "inline-flex items-center gap-2",
          labelPosition === "below" ? "flex-col items-start" : "flex-row",
          containerClassName
        )}
      >
        <SwitchPrimitives.Root
          className={cn(
            "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border/40 bg-surface-strong shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-metallic-orange data-[state=unchecked]:bg-surface-strong",
            className
          )}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={handleCheckedChange}
          ref={ref}
          {...props}
        >
          <SwitchPrimitives.Thumb
            className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
          />
        </SwitchPrimitives.Root>
        {labelNode}
      </div>
    )
  }
)

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
