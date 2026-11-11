"use client";

import type { Partner } from "@/data/partners";
import Supercluster from "supercluster";
import { useMemo } from "react";

export type ClusterFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    cluster: boolean;
    cluster_id?: number;
    point_count?: number;
    partnerId?: string;
  };
};

/**
 * Supercluster index for country-view city/college markers.
 * Memoized per partner set; query by zoom + bounds.
 */
export function usePartnerClusters(partners: Partner[]) {
  const index = useMemo(() => {
    const sc = new Supercluster<{ partnerId: string }>({
      radius: 60,
      maxZoom: 16,
      minZoom: 0,
    });
    const points = partners.map((p) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [p.lng, p.lat] as [number, number],
      },
      properties: { partnerId: p.id },
    }));
    sc.load(points);
    return sc;
  }, [partners]);

  const getClusters = (
    bbox: [number, number, number, number],
    zoom: number,
  ) => index.getClusters(bbox, Math.round(zoom));

  const getExpansionZoom = (clusterId: number) =>
    index.getClusterExpansionZoom(clusterId);

  const getLeaves = (clusterId: number) =>
    index.getLeaves(clusterId, Infinity);

  return { getClusters, getExpansionZoom, getLeaves, index };
}
