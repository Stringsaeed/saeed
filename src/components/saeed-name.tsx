import { cn } from "@/lib/utils";

type SaeedNameProps = {
  className?: string;
};

export function SaeedName({ className }: SaeedNameProps) {
  return <span className={cn("saeed-name", className)}>Saeed</span>;
}
