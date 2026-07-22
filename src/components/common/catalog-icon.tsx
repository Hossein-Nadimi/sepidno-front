"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Image as ImageIcon, type LucideIcon } from "lucide-react";
import { resolveMediaUrl } from "@/lib/utils";

interface CatalogIconProps {
  /** Lucide icon name (e.g. "shirt", "scissors") */
  icon?: string;
  /** Optional image URL — overrides icon when present */
  image?: string;
  /** Display size in pixels (default 20) */
  size?: number;
  /** Optional className for the wrapper */
  className?: string;
}

/**
 * Renders a catalog item's icon or image.
 *
 * - If `image` is provided and loads successfully, it is rendered.
 * - If `image` fails to load, falls back to `icon`.
 * - If `icon` is a valid lucide icon name, that icon is rendered.
 * - Otherwise, a default `ImageIcon` placeholder is shown.
 */
export function CatalogIcon({ icon, image, size = 20, className = "" }: CatalogIconProps) {
  const [imageError, setImageError] = useState(false);

  if (image && !imageError) {
    return (
      <img
        src={resolveMediaUrl(image)}
        alt=""
        width={size}
        height={size}
        className={`rounded object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImageError(true)}
      />
    );
  }

  if (icon) {
    // Lucide exports every icon as a PascalCase component.
    // Convert kebab-case names: "washing-machine" → "WashingMachine"
    const pascal = icon
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[pascal];
    if (IconComponent) {
      return <IconComponent className={className} style={{ width: size, height: size }} />;
    }
  }

  return <ImageIcon className={className} style={{ width: size, height: size }} />;
}
