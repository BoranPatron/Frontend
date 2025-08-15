export type AddressSuggestion = {
	id: string;
	label: string;
	street?: string;
	houseNumber?: string;
	zip?: string;
	city?: string;
	country?: string;
	lat?: number;
	lng?: number;
};

function parseMapboxFeature(feature: any): AddressSuggestion {
	const context = feature.context || [];
	const get = (idPrefix: string) => {
		const item = context.find((c: any) => typeof c.id === 'string' && c.id.startsWith(idPrefix));
		return item?.text || item?.text_de || item?.place_name || undefined;
	};
	const place = get('place');
	const postcode = get('postcode');
	const country = get('country');
	let street = feature.text;
	let houseNumber = feature.address;
	if (!houseNumber && feature.properties?.address) {
		houseNumber = feature.properties.address;
	}
	return {
		id: feature.id,
		label: feature.place_name,
		street,
		houseNumber,
		zip: postcode,
		city: place || feature.place_name,
		country,
		lat: feature.center?.[1],
		lng: feature.center?.[0],
	};
}

function parseNominatimItem(item: any): AddressSuggestion {
	const a = item.address || {};
	const street = a.road || a.pedestrian || a.footway || a.cycleway || a.path || a.street || undefined;
	const houseNumber = a.house_number || undefined;
	const city = a.city || a.town || a.village || a.hamlet || a.municipality || a.county || undefined;
	const zip = a.postcode || undefined;
	const country = a.country || undefined;
	return {
		id: String(item.place_id),
		label: item.display_name,
		street,
		houseNumber,
		zip,
		city,
		country,
		lat: item.lat ? parseFloat(item.lat) : undefined,
		lng: item.lon ? parseFloat(item.lon) : undefined,
	};
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	// Prefer Mapbox if token available
	const mapboxToken = (import.meta as any).env?.VITE_MAPBOX_TOKEN as string | undefined;
	if (mapboxToken) {
		const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?autocomplete=true&limit=5&language=de&country=de,at,ch&types=address,place,postcode&access_token=${mapboxToken}`;
		const res = await fetch(url);
		if (!res.ok) throw new Error('Adresssuche fehlgeschlagen (Mapbox)');
		const data = await res.json();
		return (data.features || []).map(parseMapboxFeature);
	}

	// Fallback: OpenStreetMap Nominatim (öffentliche API, rate limits beachten)
	const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=de&q=${encodeURIComponent(trimmed)}`;
	const res = await fetch(url, {
		headers: {
			// Note: Browser setzt keinen User-Agent; Nominatim-Policy empfiehlt verantwortungsvolle Nutzung
			'Accept': 'application/json'
		}
	});
	if (!res.ok) throw new Error('Adresssuche fehlgeschlagen (OSM)');
	const items = await res.json();
	return (items || []).map(parseNominatimItem);
}

export function formatSuggestionForDisplay(s: AddressSuggestion): string {
	const parts = [
		[s.street, s.houseNumber].filter(Boolean).join(' '),
		[s.zip, s.city].filter(Boolean).join(' '),
		s.country,
	].filter(Boolean);
	return parts.join(', ');
}

