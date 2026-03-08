"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type RelationshipLevel = "HOT" | "NORMAL" | "BLOCK";

interface RelationshipContextType {
  relationships: Map<string, RelationshipLevel>;
  setRelationship: (userId: string, level: RelationshipLevel) => void;
  getRelationship: (userId: string) => RelationshipLevel;
  isBlocked: (userId: string) => boolean;
  isHot: (userId: string) => boolean;
}

const RelationshipContext = createContext<RelationshipContextType | undefined>(
  undefined
);

export function RelationshipProvider({ children }: { children: ReactNode }) {
  const [relationships, setRelationships] = useState<
    Map<string, RelationshipLevel>
  >(new Map());

  const setRelationship = (userId: string, level: RelationshipLevel) => {
    setRelationships((prev) => {
      const newMap = new Map(prev);
      newMap.set(userId, level);
      return newMap;
    });
  };

  const getRelationship = (userId: string): RelationshipLevel => {
    return relationships.get(userId) || "NORMAL";
  };

  const isBlocked = (userId: string): boolean => {
    return getRelationship(userId) === "BLOCK";
  };

  const isHot = (userId: string): boolean => {
    return getRelationship(userId) === "HOT";
  };

  return (
    <RelationshipContext.Provider
      value={{
        relationships,
        setRelationship,
        getRelationship,
        isBlocked,
        isHot,
      }}
    >
      {children}
    </RelationshipContext.Provider>
  );
}

export function useRelationship() {
  const context = useContext(RelationshipContext);
  if (!context) {
    throw new Error(
      "useRelationship must be used within a RelationshipProvider"
    );
  }
  return context;
}
