import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
    steps: string[];
    currentStep: number;
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
    return (
        <div className="relative flex justify-between w-full">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 -translate-y-1/2" />
            <div
                className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-300 ease-in-out"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <div key={step} className="flex flex-col items-center gap-2 bg-background px-2">
                        <div
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                                isCompleted
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : isCurrent
                                        ? "border-primary text-primary"
                                        : "border-muted text-muted-foreground"
                            )}
                        >
                            {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        <span
                            className={cn(
                                "text-xs font-medium absolute top-10 w-32 text-center",
                                isCurrent ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {step}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
