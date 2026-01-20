'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const libraries: ("places")[] = ['places'];
import { useTheme } from 'next-themes';

interface MapLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category: string;
  tags: string[];
  rating: number | null;
  visitDate: string | null;
  notes: string | null;
  photos: string[];
}

const defaultCategories = [
  { value: '맛집', icon: '🍽️', color: '#ef4444' },
  { value: '카페', icon: '☕', color: '#f59e0b' },
  { value: '여행지', icon: '🏝️', color: '#3b82f6' },
  { value: '숙소', icon: '🏨', color: '#8b5cf6' },
  { value: '쇼핑', icon: '🛍️', color: '#ec4899' },
  { value: '문화', icon: '🎭', color: '#6366f1' },
  { value: '자연', icon: '🌲', color: '#22c55e' },
  { value: '기타', icon: '📍', color: '#6b7280' },
];

const categoryColors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#22c55e', '#6b7280', '#14b8a6', '#f97316'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

// Dark mode map styles
const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

export default function MapPage() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<MapLocation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarker, setSelectedMarker] = useState<MapLocation | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mounted, setMounted] = useState(false);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [searchedPlace, setSearchedPlace] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating?: number;
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [infoWindowTags, setInfoWindowTags] = useState('');
  const [showMyLocationResults, setShowMyLocationResults] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📍');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [placeResults, setPlaceResults] = useState<Array<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating?: number;
    distance?: number;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { theme } = useTheme();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Search places using PlacesService
  const searchPlaces = useCallback(() => {
    if (!mapRef.current || !placeSearchQuery.trim()) return;

    setIsSearching(true);
    const service = new google.maps.places.PlacesService(mapRef.current);
    const searchLocation = userLocation || mapCenter;

    service.textSearch(
      {
        query: placeSearchQuery,
        location: new google.maps.LatLng(searchLocation.lat, searchLocation.lng),
        radius: 50000, // 50km radius
      },
      (results, status) => {
        setIsSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const placesWithDistance = results.map((place) => {
            const lat = place.geometry?.location?.lat() || 0;
            const lng = place.geometry?.location?.lng() || 0;
            const distance = userLocation
              ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
              : calculateDistance(searchLocation.lat, searchLocation.lng, lat, lng);

            return {
              name: place.name || '',
              address: place.formatted_address || '',
              lat,
              lng,
              rating: place.rating,
              distance,
            };
          });

          // Sort by distance and take top 10
          const sortedResults = placesWithDistance
            .sort((a, b) => (a.distance || 0) - (b.distance || 0))
            .slice(0, 10);

          setPlaceResults(sortedResults);
        } else {
          setPlaceResults([]);
        }
      }
    );
  }, [placeSearchQuery, userLocation, mapCenter]);

  // Open Google Maps directions
  const openDirections = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  // Add new category
  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newColor = categoryColors[categories.length % categoryColors.length];
    setCategories([...categories, { value: newCategoryName, icon: newCategoryIcon, color: newColor }]);
    setNewCategoryName('');
    setNewCategoryIcon('📍');
  };

  // Remove category
  const removeCategory = (value: string) => {
    if (categories.length <= 1) return; // Keep at least one category
    setCategories(categories.filter(c => c.value !== value));
    // If current form category is removed, set to first available
    if (form.category === value) {
      const remaining = categories.filter(c => c.value !== value);
      if (remaining.length > 0) {
        setForm(prev => ({ ...prev, category: remaining[0].value }));
      }
    }
  };

  // Extract unique tags and regions from all locations
  const allTags = Array.from(new Set(locations.flatMap((loc) => loc.tags))).filter(Boolean);
  const allRegions = Array.from(
    new Set(
      locations
        .map((loc) => {
          // Extract region from address (e.g., "서울특별시 용산구" -> "용산구")
          const match = loc.address?.match(/([가-힣]+[시군구])/);
          return match ? match[1] : null;
        })
        .filter(Boolean)
    )
  ) as string[];

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: 37.5665,
    longitude: 126.978,
    category: '맛집',
    tags: '',
    rating: 0,
    visitDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchLocations();
  }, [selectedCategory]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const url = selectedCategory
        ? `/api/my-world/locations?category=${selectedCategory}`
        : '/api/my-world/locations';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSearchedPlace = () => {
    if (searchedPlace) {
      setEditingLocation(null);
      setForm({
        name: searchedPlace.name,
        address: searchedPlace.address,
        latitude: searchedPlace.lat,
        longitude: searchedPlace.lng,
        category: '맛집',
        tags: '',
        rating: searchedPlace.rating ? Math.round(searchedPlace.rating) : 0,
        visitDate: '',
        notes: '',
      });
      setSearchedPlace(null);
      setPlaceSearchQuery('');
      setPlaceResults([]);
    }
  };

  const selectLocation = (location: MapLocation) => {
    setEditingLocation(location);
    setForm({
      name: location.name,
      address: location.address || '',
      latitude: location.latitude,
      longitude: location.longitude,
      category: location.category,
      tags: location.tags.join(', '),
      rating: location.rating || 0,
      visitDate: location.visitDate?.split('T')[0] || '',
      notes: location.notes || '',
    });
    setMapCenter({ lat: location.latitude, lng: location.longitude });
  };

  const resetForm = () => {
    setEditingLocation(null);
    setForm({
      name: '',
      address: '',
      latitude: mapCenter.lat,
      longitude: mapCenter.lng,
      category: '맛집',
      tags: '',
      rating: 0,
      visitDate: '',
      notes: '',
    });
    setSelectedMarker(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert('장소 이름을 입력해주세요');
      return;
    }

    try {
      const url = editingLocation
        ? `/api/my-world/locations/${editingLocation.id}`
        : '/api/my-world/locations';

      const res = await fetch(url, {
        method: editingLocation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          visitDate: form.visitDate || null,
          rating: form.rating || null,
        }),
      });

      if (res.ok) {
        fetchLocations();
        resetForm();
      } else {
        alert('저장에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다');
    }
  };

  const handleDelete = async () => {
    if (!editingLocation || !confirm('이 장소를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/my-world/locations/${editingLocation.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchLocations();
        resetForm();
      } else {
        alert('삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제에 실패했습니다');
    }
  };

  const getCategoryInfo = (category: string) => {
    return categories.find((c) => c.value === category) || categories[categories.length - 1];
  };

  const filteredLocations = locations.filter((loc) => {
    // Text search filter
    const matchesSearch = !searchQuery ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    // Tag filter
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some((tag) => loc.tags.includes(tag));

    // Region filter
    const matchesRegion = !selectedRegion ||
      loc.address?.includes(selectedRegion);

    return matchesSearch && matchesTags && matchesRegion;
  });

  // Top N search results for display
  const searchResults = searchQuery ? filteredLocations.slice(0, 5) : [];

  // Quick tag update from InfoWindow
  const handleQuickTagUpdate = async (locationId: string, newTags: string) => {
    try {
      const res = await fetch(`/api/my-world/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        fetchLocations();
        setInfoWindowTags('');
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">지도</h1>
      </div>

      {/* Search Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Google Places Search */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">새 장소 검색</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={placeSearchQuery}
              onChange={(e) => setPlaceSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  searchPlaces();
                }
              }}
              placeholder="스타벅스, CGV 용산..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={searchPlaces}
              disabled={isSearching || !isLoaded}
              className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm disabled:opacity-50"
            >
              {isSearching ? '...' : '검색'}
            </button>
          </div>
          {/* Search Results - up to 10, sorted by distance */}
          {placeResults.length > 0 && (
            <div className="mt-3 max-h-[250px] overflow-y-auto space-y-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                가까운 순 ({placeResults.length}개 결과)
              </div>
              {placeResults.map((place, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSearchedPlace(place);
                    setMapCenter({ lat: place.lat, lng: place.lng });
                  }}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    searchedPlace?.lat === place.lat && searchedPlace?.lng === place.lng
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{place.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{place.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {place.rating && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="text-yellow-400">★</span> {place.rating.toFixed(1)}
                          </span>
                        )}
                        {place.distance !== undefined && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            {place.distance < 1
                              ? `${Math.round(place.distance * 1000)}m`
                              : `${place.distance.toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchedPlace(place);
                        setMapCenter({ lat: place.lat, lng: place.lng });
                      }}
                      className="ml-2 px-2 py-1 text-xs bg-violet-600 text-white rounded hover:bg-violet-700"
                    >
                      선택
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Selected place info */}
          {searchedPlace && (
            <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{searchedPlace.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{searchedPlace.address}</p>
                  {searchedPlace.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{searchedPlace.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => setSearchedPlace(null)}
                    className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    취소
                  </button>
                  <button
                    onClick={saveSearchedPlace}
                    className="px-2 py-1 text-xs bg-violet-600 text-white rounded hover:bg-violet-700"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* My Locations Search */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">내 장소 검색</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowMyLocationResults(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowMyLocationResults(true);
                }
              }}
              placeholder="이름, 주소, 태그로 검색..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={() => setShowMyLocationResults(true)}
              className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm"
            >
              검색
            </button>
          </div>
          {showMyLocationResults && searchQuery && (
            <div className="mt-3 max-h-[200px] overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">검색 결과가 없어요</p>
              ) : (
                searchResults.map((loc) => {
                  const catInfo = getCategoryInfo(loc.category);
                  return (
                    <div
                      key={loc.id}
                      onClick={() => {
                        setMapCenter({ lat: loc.latitude, lng: loc.longitude });
                        setSelectedMarker(loc);
                        selectLocation(loc);
                        setShowMyLocationResults(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <span className="text-lg">{catInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{loc.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{loc.address}</p>
                      </div>
                    </div>
                  );
                })
              )}
              {searchResults.length > 0 && filteredLocations.length > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{filteredLocations.length - 5}개 더 있음
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Map + Form */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Left: Map */}
        <div className="lg:w-1/2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 overflow-hidden h-[500px]">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={12}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                onClick={(e) => {
                  if (e.latLng) {
                    setForm({
                      ...form,
                      latitude: e.latLng.lat(),
                      longitude: e.latLng.lng(),
                    });
                    setMapCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                  }
                }}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  styles: mounted && theme === 'dark' ? darkMapStyles : undefined,
                }}
              >
                {filteredLocations.map((location) => {
                  const catInfo = getCategoryInfo(location.category);
                  return (
                    <Marker
                      key={location.id}
                      position={{ lat: location.latitude, lng: location.longitude }}
                      onClick={() => {
                        setSelectedMarker(location);
                        selectLocation(location);
                      }}
                      label={{
                        text: catInfo.icon,
                        fontSize: '20px',
                      }}
                    />
                  );
                })}

                {searchedPlace && (
                  <Marker
                    position={{ lat: searchedPlace.lat, lng: searchedPlace.lng }}
                    icon={{
                      url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    }}
                  />
                )}

                {/* Current form position marker */}
                <Marker
                  position={{ lat: form.latitude, lng: form.longitude }}
                  icon={{
                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  }}
                />

                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
                    onCloseClick={() => {
                      setSelectedMarker(null);
                      setInfoWindowTags('');
                    }}
                  >
                    <div className="p-2 min-w-[180px] max-w-[220px]">
                      <h3 className="font-semibold text-gray-900 text-sm">{selectedMarker.name}</h3>
                      {selectedMarker.address && (
                        <p className="text-xs text-gray-500 truncate">{selectedMarker.address}</p>
                      )}
                      {selectedMarker.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-xs ${
                                i < selectedMarker.rating! ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Current Tags */}
                      {selectedMarker.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedMarker.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Tag Edit */}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <input
                          type="text"
                          value={infoWindowTags || selectedMarker.tags.join(', ')}
                          onChange={(e) => setInfoWindowTags(e.target.value)}
                          placeholder="태그 수정 (쉼표 구분)"
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!infoWindowTags) {
                              setInfoWindowTags(selectedMarker.tags.join(', '));
                            }
                          }}
                        />
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickTagUpdate(selectedMarker.id, infoWindowTags || selectedMarker.tags.join(', '));
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-violet-600 text-white rounded hover:bg-violet-700"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => selectLocation(selectedMarker)}
                            className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            수정
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDirections(selectedMarker.latitude, selectedMarker.longitude, selectedMarker.name);
                          }}
                          className="w-full mt-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                        >
                          🧭 길찾기
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <p className="text-gray-500">지도 로딩 중...</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            지도를 클릭해서 위치를 선택하세요
          </p>
        </div>

        {/* Right: Form */}
        <div className="lg:w-1/2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editingLocation ? '장소 수정' : '새 장소'}
              </h3>
              {editingLocation && (
                <button
                  onClick={resetForm}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  새로 작성
                </button>
              )}
            </div>
            <div className="space-y-3">
              {/* Name & Address in one row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">이름 *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="장소 이름"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">주소</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="주소"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">카테고리 *</label>
                  <button
                    onClick={() => setShowCategoryEditor(!showCategoryEditor)}
                    className="text-xs text-violet-600 hover:text-violet-700"
                  >
                    {showCategoryEditor ? '닫기' : '편집'}
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                        form.category === cat.value
                          ? 'bg-violet-100 dark:bg-violet-900/50 ring-1 ring-violet-500'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="text-gray-700 dark:text-gray-300">{cat.value}</span>
                      {showCategoryEditor && categories.length > 1 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCategory(cat.value);
                          }}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          ×
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {showCategoryEditor && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      className="w-12 px-2 py-1 text-center text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                      placeholder="🏷️"
                    />
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                      className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="새 카테고리 이름"
                    />
                    <button
                      onClick={addCategory}
                      className="px-2 py-1 text-xs bg-violet-600 text-white rounded hover:bg-violet-700"
                    >
                      추가
                    </button>
                  </div>
                )}
              </div>

              {/* Tags, Date, Rating in one row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">태그</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="쉼표로 구분"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">방문일</label>
                  <input
                    type="date"
                    value={form.visitDate}
                    onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">평점</label>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm({ ...form, rating: form.rating === star ? 0 : star })}
                        className={`text-lg transition-colors ${star <= form.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">메모</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  placeholder="메모"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                {editingLocation && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    삭제
                  </button>
                )}
                <div className="flex-1" />
                {editingLocation && (
                  <button
                    onClick={resetForm}
                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  className="px-4 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  {editingLocation ? '수정' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">필터</h3>
        <div className="max-h-[200px] overflow-y-auto space-y-3">
          {/* Category Filter */}
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">카테고리:</span>
            <div className="inline-flex gap-1 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                  !selectedCategory
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                전체
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value === selectedCategory ? null : cat.value)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {cat.icon} {cat.value}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">태그:</span>
              <div className="inline-flex gap-1 flex-wrap">
                <button
                  onClick={() => setSelectedTags([])}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    selectedTags.length === 0
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  전체
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      );
                    }}
                    className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Region Filter */}
          {allRegions.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">지역:</span>
              <div className="inline-flex gap-1 flex-wrap">
                <button
                  onClick={() => setSelectedRegion(null)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    !selectedRegion
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  전체
                </button>
                {allRegions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                    className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                      selectedRegion === region
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? '검색 결과가 없어요' : '저장된 장소가 없어요. 위에서 장소를 검색하거나 지도를 클릭해서 추가해보세요!'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredLocations.map((location) => {
            const catInfo = getCategoryInfo(location.category);
            return (
              <div
                key={location.id}
                onClick={() => {
                  setMapCenter({ lat: location.latitude, lng: location.longitude });
                  setSelectedMarker(location);
                  selectLocation(location);
                }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-all ${
                  editingLocation?.id === location.id
                    ? 'border-violet-500 ring-2 ring-violet-500/20'
                    : 'border-violet-100 dark:border-violet-900/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0"
                    style={{ backgroundColor: catInfo.color }}
                  >
                    {catInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {location.name}
                    </h3>
                    {location.address && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {location.address}
                      </p>
                    )}
                    {location.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < location.rating! ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
