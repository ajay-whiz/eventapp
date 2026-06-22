export function extractCityFromPlace(
  place: google.maps.places.PlaceResult,
): string {
  const components = place.address_components || [];

  const cityComponent = components.find(
    (component) =>
      component.types.includes('locality') ||
      component.types.includes('postal_town') ||
      component.types.includes('administrative_area_level_2'),
  );

  if (cityComponent?.long_name) {
    return cityComponent.long_name;
  }

  const address = place.formatted_address || '';
  const firstPart = address.split(',')[0]?.trim();
  return firstPart || '';
}
