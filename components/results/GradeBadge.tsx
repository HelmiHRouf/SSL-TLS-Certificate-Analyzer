import type { Grade } from "@/types/cert";
import { getGradeColorClasses } from "@/lib/grader";

interface GradeBadgeProps {
  grade: Grade;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-12 h-12 text-lg",
  md: "w-16 h-16 text-2xl",
  lg: "w-20 h-20 text-3xl",
};

export function GradeBadge({ grade, size = "md" }: GradeBadgeProps) {
  const colors = getGradeColorClasses(grade);

  return (
    <div
      className={`${sizeClasses[size]} ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center font-bold shadow-sm`}
    >
      {grade}
    </div>
  );
}