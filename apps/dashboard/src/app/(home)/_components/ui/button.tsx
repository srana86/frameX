import { Button as ShadcnButton } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import * as React from "react";
import Link from "next/link";
import { cn } from "@/utils";
import { ArrowRight, Play, LucideIcon } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <ShadcnButton className={cn(className)} variant={variant} size={size} ref={ref} {...props} />;
});
Button.displayName = "Button";

// Base props for both button types
export interface BaseButtonProps {
  text?: string;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any; // Allow all other button props
}

// Start Building Button - Blue with white text and white circle with blue arrow
export const StartBuildingButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, BaseButtonProps>(
  ({ text, icon: Icon, iconPosition = "right", href, onClick, type = "button", disabled, className, children, ...props }, ref) => {
    const buttonContent = (
      <>
        {iconPosition === "left" && Icon && (
          <div
            className='relative flex items-center justify-center shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-[1.05]'
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "48px",
              paddingTop: "3px",
              paddingRight: "2px",
              paddingBottom: "3px",
              paddingLeft: "2px",
              gap: "8px",
              overflow: "visible",
            }}
          >
            {/* Blurred Gradient Effects */}
            <div
              className='absolute pointer-events-none rounded-full'
              style={{
                left: "50%",
                top: "15%",
                width: "35px",
                height: "25px",
                background:
                  "radial-gradient(ellipse, rgba(108, 255, 162, 1) 0%, rgba(108, 255, 162, 0.7) 40%, rgba(108, 255, 162, 0.4) 60%, transparent 100%)",
                filter: "blur(8px)",
                zIndex: 0,
                opacity: 1,
                animation: "gradientBounce 2s ease-in-out infinite",
              }}
            />
            <div
              className='absolute pointer-events-none rounded-full'
              style={{
                left: "15%",
                top: "20%",
                width: "60px",
                height: "30px",
                background:
                  "radial-gradient(ellipse, rgba(230, 88, 255, 1) 0%, rgba(230, 88, 255, 0.7) 40%, rgba(230, 88, 255, 0.4) 60%, transparent 100%)",
                filter: "blur(8px)",
                zIndex: 0,
                opacity: 1,
                animation: "gradientBouncePurple 2s ease-in-out infinite 1s",
              }}
            />
            <div
              className='absolute bg-white flex items-center justify-center'
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "48px",
                zIndex: 1,
                boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Icon
              className='text-[#0448FD] relative'
              style={{
                width: "18px",
                height: "18px",
                zIndex: 2,
              }}
            />
          </div>
        )}

        <span
          className={cn(
            "whitespace-nowrap",
            iconPosition === "right" && Icon && "pl-4 mr-2",
            iconPosition === "left" && Icon && "pr-4 ml-2"
          )}
        >
          {children || text}
        </span>

        {iconPosition === "right" && Icon && (
          <div
            className='relative flex items-center justify-center shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:translate-x-0.5'
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "48px",
              paddingTop: "3px",
              paddingRight: "2px",
              paddingBottom: "3px",
              paddingLeft: "2px",
              gap: "8px",
              overflow: "visible",
            }}
          >
            {/* Blurred Gradient Effects - Green glow above/left, Purple glow below/right */}
            <div
              className='absolute pointer-events-none rounded-full'
              style={{
                left: "50%",
                top: "15%",
                width: "35px",
                height: "25px",
                background:
                  "radial-gradient(ellipse, rgba(108, 255, 162, 1) 0%, rgba(108, 255, 162, 0.7) 40%, rgba(108, 255, 162, 0.4) 60%, transparent 100%)",
                filter: "blur(8px)",
                zIndex: 0,
                opacity: 1,
                animation: "gradientBounce 2s ease-in-out infinite",
              }}
            />
            <div
              className='absolute pointer-events-none rounded-full'
              style={{
                left: "15%",
                top: "20%",
                width: "60px",
                height: "30px",
                background:
                  "radial-gradient(ellipse, rgba(230, 88, 255, 1) 0%, rgba(230, 88, 255, 0.7) 40%, rgba(230, 88, 255, 0.4) 60%, transparent 100%)",
                filter: "blur(8px)",
                zIndex: 0,
                opacity: 1,
                animation: "gradientBouncePurple 2s ease-in-out infinite 1s",
              }}
            />
            <div
              className='absolute bg-white flex items-center justify-center'
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "48px",
                zIndex: 1,
                boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Icon
              className='text-[#0448FD] relative group-hover:animate-[arrowSlideRight_0.6s_ease-in-out]'
              style={{
                width: "18px",
                height: "18px",
                zIndex: 2,
              }}
            />
          </div>
        )}
      </>
    );

    const buttonClasses = cn(
      "text-white font-medium flex items-center relative",
      "inline-flex",
      "h-[48px] sm:h-[50px] md:h-[52px] lg:h-[54px]",
      "rounded-[48px] sm:rounded-[52px] md:rounded-[58px] lg:rounded-[65px]",
      "text-sm sm:text-base",
      "px-3",
      "bg-[#0448FD]",
      "overflow-hidden",
      "transition-all duration-300 ease-in-out",
      "hover:scale-[1.02] hover:bg-[#0548FD]",
      "active:scale-[0.98]",
      "transform group",
      disabled && "opacity-50 cursor-not-allowed",
      className
    );

    const buttonStyle = {
      boxShadow: `
      0px 1px 1px 0px rgba(4, 72, 253, 0.18),
      0px 2px 2.8px 0px rgba(4, 72, 253, 0.44),
      0px 5px 12.8px 0px rgba(4, 72, 253, 0.49),
      0px 14px 10.6px 0px rgba(4, 72, 253, 0.18),
      0px -5px 11.1px 0px rgba(255, 255, 255, 0.52) inset,
      0px 1px 12.4px 0px rgba(4, 72, 253, 0.2)
    `,
      gap: "6px",
      transition: "all 0.3s ease-in-out",
    };

    if (href) {
      return (
        <Link
          href={href}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          className={buttonClasses}
          style={buttonStyle}
          onClick={onClick}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <Button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        className={buttonClasses}
        style={buttonStyle}
        onClick={onClick}
        type={type}
        disabled={disabled}
        {...props}
      >
        {buttonContent}
      </Button>
    );
  }
);
StartBuildingButton.displayName = "StartBuildingButton";

// Watch Demo Button - White with dark gray text and white circle with black play icon
export const WatchDemoButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, BaseButtonProps>(
  ({ text, icon: Icon, iconPosition = "left", href, onClick, type = "button", disabled, className, children, ...props }, ref) => {
    const buttonContent = (
      <>
        {iconPosition === "left" && Icon && (
          <div
            className='relative flex items-center border border-gray-100 justify-center shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-[1.05]'
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "48px",
              paddingTop: "3px",
              paddingRight: "2px",
              paddingBottom: "3px",
              paddingLeft: "2px",
              gap: "8px",
              overflow: "visible",
            }}
          >
            <div
              className='absolute bg-white flex items-center justify-center'
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "48px",
                zIndex: 1,
                boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Icon
              className='text-black relative fill-black animate-[playPulse_1.5s_ease-in-out_infinite]'
              style={{
                width: "18px",
                height: "18px",
                zIndex: 2,
              }}
            />
          </div>
        )}

        <span
          className={cn(
            "whitespace-nowrap",
            iconPosition === "right" && Icon && "pl-4 mr-3",
            iconPosition === "left" && Icon && "pr-4 ml-3"
          )}
        >
          {children || text}
        </span>

        {iconPosition === "right" && Icon && (
          <div
            className='relative flex items-center border border-gray-100 justify-center shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-[1.05] group-hover:translate-x-0.5'
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "48px",
              paddingTop: "3px",
              paddingRight: "2px",
              paddingBottom: "3px",
              paddingLeft: "2px",
              gap: "8px",
              overflow: "visible",
            }}
          >
            <div
              className='absolute bg-white flex items-center justify-center'
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "48px",
                zIndex: 1,
                boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Icon
              className='text-black relative fill-black animate-[playPulse_1.5s_ease-in-out_infinite]'
              style={{
                width: "18px",
                height: "18px",
                zIndex: 2,
              }}
            />
          </div>
        )}
      </>
    );

    const buttonClasses = cn(
      "bg-white hover:bg-gray-50 text-gray-800 font-medium flex items-center relative",
      "inline-flex",
      "h-[48px] sm:h-[50px] md:h-[52px] lg:h-[54px]",
      "rounded-[48px] sm:rounded-[52px] md:rounded-[58px] lg:rounded-[65px]",
      "text-sm sm:text-base",
      "px-3",
      "border border-gray-200",
      "overflow-hidden",
      "transition-all duration-300 ease-in-out",
      "hover:scale-[1.02]",
      "active:scale-[0.98]",
      "transform group",
      disabled && "opacity-50 cursor-not-allowed",
      className
    );

    const buttonStyle = {
      gap: "6px",
    };

    if (href) {
      return (
        <Link
          href={href}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          className={buttonClasses}
          style={buttonStyle}
          onClick={onClick}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <Button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        className={buttonClasses}
        style={buttonStyle}
        onClick={onClick}
        type={type}
        disabled={disabled}
        {...props}
      >
        {buttonContent}
      </Button>
    );
  }
);
WatchDemoButton.displayName = "WatchDemoButton";

export default Button;
