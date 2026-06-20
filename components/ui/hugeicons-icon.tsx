import * as React from "react"
import {
  HugeiconsIcon as BaseHugeiconsIcon,
  type IconSvgElement,
} from "@hugeicons/react"

type HugeIconAttributes =
  | { [key: string]: string | number }
  | { readonly [key: string]: string | number }

type HugeIconSource =
  | readonly (readonly [string, HugeIconAttributes])[]
  | [string, HugeIconAttributes][]

type BaseHugeiconsIconProps = React.ComponentPropsWithoutRef<
  typeof BaseHugeiconsIcon
>

type HugeiconsIconProps = Omit<
  BaseHugeiconsIconProps,
  "icon" | "altIcon" | "strokeWidth"
> & {
  icon: HugeIconSource
  altIcon?: HugeIconSource
  strokeWidth?: React.SVGProps<SVGSVGElement>["strokeWidth"]
}

const HugeiconsIcon = React.forwardRef<SVGSVGElement, HugeiconsIconProps>(
  ({ icon, altIcon, strokeWidth, ...props }, ref) => {
    const normalizedStrokeWidth =
      typeof strokeWidth === "string" ? Number.parseFloat(strokeWidth) : strokeWidth

    return (
      <BaseHugeiconsIcon
        ref={ref}
        icon={icon as IconSvgElement}
        altIcon={altIcon as IconSvgElement | undefined}
        strokeWidth={
          Number.isFinite(normalizedStrokeWidth)
            ? normalizedStrokeWidth
            : undefined
        }
        {...props}
      />
    )
  }
)
HugeiconsIcon.displayName = "HugeiconsIcon"

export { HugeiconsIcon }
export type { HugeiconsIconProps, HugeIconSource }