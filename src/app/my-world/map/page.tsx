'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';

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

const categories = [
  { value: '맛집', icon: '🍽️', color: '#ef4444' },
  { value: '카페', icon: '☕', color: '#f59e0b' },
  { value: '여행지', icon: '🏝️', color: '#3b82f6' },
  { value: '숙소', icon: '🏨', color: '#8b5cf6' },
  { value: '쇼핑', icon: '🛍️', color: '#ec4899' },
  { value: '문화', icon: '🎭', color: '#6366f1' },
  { value: '자연', icon: '🌲', color: '#22c55e' },
  { value: '기타', icon: '📍', color: '#6b7280' },
];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
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
  const [showModal, setShowModal] = useState(false);
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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { theme } = useTheme();

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

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setForm((prev) => ({
        ...prev,
        latitude: e.latLng!.lat(),
        longitude: e.latLng!.lng(),
      }));
    }
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setSearchedPlace({
          name: place.name || '',
          address: place.formatted_address || '',
          lat,
          lng,
          rating: place.rating,
        });
        setMapCenter({ lat, lng });
        setPlaceSearchQuery(place.name || '');
      }
    }
  }, []);

  const saveSearchedPlace = () => {
    if (searchedPlace) {
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
      setShowModal(true);
      setSearchedPlace(null);
      setPlaceSearchQuery('');
    }
  };

  const openModal = (location?: MapLocation) => {
    if (location) {
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
    } else {
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
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLocation(null);
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
        closeModal();
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
        closeModal();
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

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">지도</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
        >
          장소 추가
        </button>
      </div>

      {/* Google Places Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {isLoaded ? (
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                  componentRestrictions: { country: 'kr' },
                  fields: ['name', 'formatted_address', 'geometry', 'rating'],
                }}
                className="flex-1"
              >
                <input
                  type="text"
                  value={placeSearchQuery}
                  onChange={(e) => setPlaceSearchQuery(e.target.value)}
                  placeholder="새로운 장소 검색 (예: CGV 용산, 스타벅스 강남)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                disabled
                placeholder="지도 로딩 중..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500"
              />
            )}
          </div>
          {searchedPlace && (
            <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{searchedPlace.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{searchedPlace.address}</p>
                {searchedPlace.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{searchedPlace.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchedPlace(null)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={saveSearchedPlace}
                  className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                  내 장소에 추가
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="내 장소에서 검색..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
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
                className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1 ${
                  selectedCategory === cat.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Google Map */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/30 overflow-hidden mb-6">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={12}
            onClick={onMapClick}
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
                  onClick={() => setSelectedMarker(location)}
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

            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2 min-w-[150px]">
                  <h3 className="font-semibold text-gray-900">{selectedMarker.name}</h3>
                  {selectedMarker.address && (
                    <p className="text-sm text-gray-500">{selectedMarker.address}</p>
                  )}
                  {selectedMarker.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < selectedMarker.rating! ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => openModal(selectedMarker)}
                    className="mt-2 text-sm text-violet-600 hover:underline"
                  >
                    수정하기
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <p className="text-gray-500">지도 로딩 중...</p>
          </div>
        )}
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📍</div>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? '검색 결과가 없어요' : '저장된 장소가 없어요'}
          </p>
          <button
            onClick={() => openModal()}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            첫 장소 추가하기
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => {
            const catInfo = getCategoryInfo(location.category);
            return (
              <div
                key={location.id}
                onClick={() => {
                  setMapCenter({ lat: location.latitude, lng: location.longitude });
                  setSelectedMarker(location);
                }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-violet-100 dark:border-violet-900/30 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
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
                            className={`text-sm ${
                              i < location.rating! ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                    {location.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {location.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs"
                          >
                            {tag}
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

      {/* Location Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingLocation ? '장소 수정' : '새 장소'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Mini Map for selecting location */}
              {isLoaded && (
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '200px' }}
                    center={{ lat: form.latitude, lng: form.longitude }}
                    zoom={15}
                    onClick={(e) => {
                      if (e.latLng) {
                        setForm({
                          ...form,
                          latitude: e.latLng.lat(),
                          longitude: e.latLng.lng(),
                        });
                      }
                    }}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      styles: mounted && theme === 'dark' ? darkMapStyles : undefined,
                    }}
                  >
                    <Marker position={{ lat: form.latitude, lng: form.longitude }} />
                  </GoogleMap>
                  <p className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700">
                    지도를 클릭해서 위치를 선택하세요
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="장소 이름"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="주소"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  카테고리 *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={`p-2 rounded-lg text-center transition-colors ${
                        form.category === cat.value
                          ? 'bg-violet-100 dark:bg-violet-900/50 ring-2 ring-violet-500'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-xl">{cat.icon}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{cat.value}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  태그 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="데이트, 혼밥, 뷰맛집"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  평점
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, rating: star })}
                      className={`text-2xl transition-colors ${
                        star <= form.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  {form.rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, rating: 0 })}
                      className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  방문일
                </label>
                <input
                  type="date"
                  value={form.visitDate}
                  onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  메모
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="메모"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              {editingLocation && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  삭제
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
