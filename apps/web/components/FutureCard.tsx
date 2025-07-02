import Link from "next/link";
import { FC } from "react";

interface FeatureCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
  animationDelay: string;
}

export const FeatureCard: FC<FeatureCardProps> = ({
  imageSrc,
  imageAlt,
  title,
  description,
  linkHref,
  linkText,
  animationDelay,
}) => (
  <div
    className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 opacity-0 translate-y-8 animate-fadeInUp"
    style={{ animationDelay }}
  >
    <div className="mb-4">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full object-cover rounded-lg bg-zinc-800"
      />
    </div>
    <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
    <p className="text-zinc-400 mb-4">{description}</p>
    <Link
      href={linkHref}
      className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
    >
      {linkText} →
    </Link>
  </div>
);
