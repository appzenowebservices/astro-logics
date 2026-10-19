declare function getPlanetOntology(
  planet: string,
): Promise<Record<string, any> | null>;

export { getPlanetOntology };
