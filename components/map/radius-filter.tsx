"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS_KM } from "@/lib/geo";

type RadiusFilterProps = {
  label?: string;
};

export function RadiusFilter({ label = "表示半径" }: RadiusFilterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = Number(searchParams.get("radius") ?? DEFAULT_RADIUS_KM);

  return (
    <div className="radius-filter" role="group" aria-label={label}>
      <span className="radius-filter__label">{label}</span>
      <div className="radius-filter__options">
        {RADIUS_OPTIONS_KM.map((km) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("radius", String(km));
          const href = `${pathname}?${params.toString()}`;
          const active = current === km;
          return (
            <Link
              key={km}
              href={href}
              className={`radius-filter__pill${active ? " is-active" : ""}`}
              aria-current={active ? "true" : undefined}
            >
              {km} km
            </Link>
          );
        })}
      </div>
    </div>
  );
}
