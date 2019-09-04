export const displayMap = locations => {
	mapboxgl.accessToken =
		"pk.eyJ1IjoiYWxleDk2OTIiLCJhIjoiY2p6d3A1eGdlMDBzdzNkcW5udXlpdTlkdiJ9.ti4ZD30BuIZhsTOb7td0AA";

	var map = new mapboxgl.Map({
		container: "map",
		style: "mapbox://styles/alex9692/cjzwpbhov07k31co0cuicrwra",
		scrollZoom: false
	});

	const bounds = new mapboxgl.LngLatBounds();

	locations.forEach(loc => {
		const element = document.createElement("div");
		element.className = "marker";

		new mapboxgl.Marker({
			element,
			anchor: "bottom"
		})
			.setLngLat(loc.coordinates)
			.addTo(map);

		new mapboxgl.Popup({
			offset: 30
		})
			.setLngLat(loc.coordinates)
			.setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
			.addTo(map);

		bounds.extend(loc.coordinates);
	});

	map.fitBounds(bounds, {
		padding: {
			top: 200,
			bottom: 150,
			left: 100,
			right: 100
		}
	});
};
