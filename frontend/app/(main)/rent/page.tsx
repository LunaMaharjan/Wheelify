"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, Loader2, Car } from "lucide-react";
import { searchVehicles, SearchVehiclesParams, getVehiclePriceRange } from "@/lib/api";
import { toast } from "sonner";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import {
    VEHICLE_CATEGORY_OPTIONS,
    formatVehicleCategory,
    getCategoryOptionsForVehicleType,
    sanitizeCategoryForVehicleType,
} from "@/lib/vehicleCategories";

interface Vehicle {
    _id: string;
    name: string;
    type: string;
    category?: string;
    description?: string;
    images: string[];
    pricePerDay: number;
    status: string;
    location: string;
    condition: string;
    vendorId: {
        _id: string;
        name: string;
        email: string;
        contact?: string;
    };
    createdAt: string;
}

export default function RentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // State from URL params
    const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
    const [type, setType] = useState(searchParams?.get("type") || "");
    const [category, setCategory] = useState(searchParams?.get("category") || "");
    const [minPrice, setMinPrice] = useState(searchParams?.get("minPrice") || "");
    const [maxPrice, setMaxPrice] = useState(searchParams?.get("maxPrice") || "");
    const [location, setLocation] = useState(searchParams?.get("location") || "");
    const [condition, setCondition] = useState(searchParams?.get("condition") || "");
    const [status, setStatus] = useState(searchParams?.get("status") || "available");
    
    // Local state for form inputs (before search)
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const [localType, setLocalType] = useState(type);
    const [localCategory, setLocalCategory] = useState(category);
    const [localMinPrice, setLocalMinPrice] = useState(minPrice);
    const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
    const [localLocation, setLocalLocation] = useState(location);
    const [localCondition, setLocalCondition] = useState(condition);
    const [localStatus, setLocalStatus] = useState(status);
    
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        pages: 0
    });
    const [showFilters, setShowFilters] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });

    const categoryFilterOptions = useMemo(
        () =>
            localType
                ? getCategoryOptionsForVehicleType(localType)
                : VEHICLE_CATEGORY_OPTIONS,
        [localType]
    );

    // Update URL params
    const updateURLParams = useCallback((params: Record<string, string>, resetPage = true) => {
        const newParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value && value.trim() !== "") {
                newParams.set(key, value);
            }
        });
        
        // Reset to page 1 when filters change
        if (resetPage) {
            newParams.set("page", "1");
        } else {
            // Keep current page if it exists
            const currentPage = searchParams?.get("page");
            if (currentPage) {
                newParams.set("page", currentPage);
            }
        }
        
        const queryString = newParams.toString();
        router.push(`/rent${queryString ? `?${queryString}` : ""}`, { scroll: false });
    }, [router, searchParams]);

    // Fetch vehicles from URL params (read searchParams here so we never fire with stale mirrored state).
    const fetchVehicles = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentPage = parseInt(searchParams?.get("page") || "1");
            const params: SearchVehiclesParams = {
                page: currentPage,
                limit: pagination.limit,
            };

            const q = (searchParams?.get("q") || "").trim();
            const typeFromUrl = searchParams?.get("type") || "";
            const categoryFromUrl = searchParams?.get("category") || "";
            const effectiveCategory = sanitizeCategoryForVehicleType(
                categoryFromUrl,
                typeFromUrl
            );

            if (q) params.query = q;
            if (typeFromUrl) params.type = typeFromUrl;
            if (effectiveCategory) params.category = effectiveCategory;

            const minPriceParam = searchParams?.get("minPrice") || "";
            const maxPriceParam = searchParams?.get("maxPrice") || "";
            if (minPriceParam) params.minPrice = Number(minPriceParam);
            if (maxPriceParam) params.maxPrice = Number(maxPriceParam);

            const locationParam = searchParams?.get("location") || "";
            if (locationParam.trim()) params.location = locationParam;

            const conditionParam = searchParams?.get("condition") || "";
            if (conditionParam) params.condition = conditionParam;

            const statusParam = searchParams?.get("status")?.trim() || "available";
            if (statusParam) params.status = statusParam;

            const response = await searchVehicles(params);
            
            if (response?.success) {
                setVehicles(response.vehicles || []);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            } else {
                toast.error("Failed to search vehicles");
            }
        } catch (error: any) {
            console.error("Search error:", error);
            toast.error(error?.response?.data?.message || "Failed to search vehicles");
        } finally {
            setIsLoading(false);
        }
    }, [searchParams, pagination.limit]);

    // Sync URL params to mirrored state (UI chips / filter panel)
    useEffect(() => {
        const urlQuery = searchParams?.get("q") || "";
        const urlType = searchParams?.get("type") || "";
        const urlCategory = searchParams?.get("category") || "";
        const sanitizedCategory = sanitizeCategoryForVehicleType(urlCategory, urlType);
        const urlMinPrice = searchParams?.get("minPrice") || "";
        const urlMaxPrice = searchParams?.get("maxPrice") || "";
        const urlLocation = searchParams?.get("location") || "";
        const urlCondition = searchParams?.get("condition") || "";
        const urlStatus = searchParams?.get("status") || "available";
        const urlPage = searchParams?.get("page") || "1";
        
        setSearchQuery(urlQuery);
        setType(urlType);
        setCategory(sanitizedCategory);
        setMinPrice(urlMinPrice);
        setMaxPrice(urlMaxPrice);
        setLocation(urlLocation);
        setCondition(urlCondition);
        setStatus(urlStatus);
        
        // Sync local state
        setLocalSearchQuery(urlQuery);
        setLocalType(urlType);
        setLocalCategory(sanitizedCategory);
        setLocalMinPrice(urlMinPrice);
        setLocalMaxPrice(urlMaxPrice);
        setLocalLocation(urlLocation);
        setLocalCondition(urlCondition);
        setLocalStatus(urlStatus);
        
        // Update pagination page from URL
        const pageNum = parseInt(urlPage) || 1;
        setPagination((prev) => ({ ...prev, page: pageNum }));
    }, [searchParams]);

    // Load listings when URL or page size changes
    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    // Fetch price range on mount
    useEffect(() => {
        const fetchPriceRange = async () => {
            try {
                const response = await getVehiclePriceRange();
                if (response.success) {
                    setPriceRange({ min: response.minPrice, max: response.maxPrice });
                }
            } catch (error) {
                console.error("Failed to fetch price range:", error);
            }
        };
        fetchPriceRange();
    }, []);

    // Handle search button click
    const handleSearch = () => {
        if (localMinPrice && parseInt(localMinPrice) < priceRange.min) {
            toast.error(`Minimum price must be ${priceRange.min} or greater.`);
            return;
        }
        if (localMaxPrice && parseInt(localMaxPrice) > priceRange.max) {
            toast.error(`Maximum price cannot be greater than ${priceRange.max}.`);
            return;
        }
        if (localMaxPrice && localMinPrice && parseInt(localMaxPrice) < parseInt(localMinPrice)) {
            toast.error("Maximum price cannot be less than minimum price.");
            return;
        }
        updateURLParams({
            q: localSearchQuery,
            type: localType,
            category: localCategory,
            minPrice: localMinPrice,
            maxPrice: localMaxPrice,
            location: localLocation,
            condition: localCondition,
            status: localStatus,
        });
    };

    // Clear all filters
    const handleClearFilters = () => {
        setLocalSearchQuery("");
        setLocalType("");
        setLocalCategory("");
        setLocalMinPrice("");
        setLocalMaxPrice("");
        setLocalLocation("");
        setLocalCondition("");
        setLocalStatus("available");
        
        updateURLParams({});
    };

    // Remove individual filter
    const removeFilter = (key: string) => {
        const newParams: Record<string, string> = {
            q: searchQuery,
            type,
            category,
            minPrice,
            maxPrice,
            location,
            condition,
            status,
        };
        delete newParams[key as keyof typeof newParams];
        updateURLParams(newParams);
    };

    const activeFiltersCount = [
        searchQuery,
        type,
        category,
        minPrice,
        maxPrice,
        location,
        condition,
        status !== "available" ? status : null
    ].filter(Boolean).length;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Find Your Perfect Vehicle</h1>
                <p className="text-muted-foreground">Search and filter through available vehicles for rent</p>
            </div>

            {/* Search Bar */}
                    <div className="space-y-4 py-10">
                        <div className="flex gap-2">
                            <div className="flex-1  relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, description, or location..."
                                    className="pl-10 h-12"
                                    value={localSearchQuery}
                                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSearch();
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                size="lg"
                                className="h-12 px-8"
                                onClick={handleSearch}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Search
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-12"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                                {activeFiltersCount > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </div>

                        {/* Filters Panel */}
                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Vehicle Type</Label>
                                    <Select
                                        value={localType || undefined}
                                        onValueChange={(value) => {
                                            const t = value === "all" ? "" : value;
                                            setLocalType(t);
                                            setLocalCategory((prev) =>
                                                sanitizeCategoryForVehicleType(prev, t)
                                            );
                                        }}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All types</SelectItem>
                                            <SelectItem value="car">Car</SelectItem>
                                            <SelectItem value="bike">Bike</SelectItem>
                                            <SelectItem value="scooter">Scooter</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category-filter">Category</Label>
                                    <Select
                                        value={localCategory || undefined}
                                        onValueChange={(value) => setLocalCategory(value === "all" ? "" : value)}
                                    >
                                        <SelectTrigger id="category-filter">
                                            <SelectValue
                                                placeholder={
                                                    localType
                                                        ? "Category for selected type"
                                                        : "All categories"
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All categories</SelectItem>
                                            {categoryFilterOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        placeholder="Enter location"
                                        value={localLocation}
                                        onChange={(e) => setLocalLocation(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="condition">Condition</Label>
                                    <Select value={localCondition || undefined} onValueChange={(value) => setLocalCondition(value === "all" ? "" : value)}>
                                        <SelectTrigger id="condition">
                                            <SelectValue placeholder="All conditions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All conditions</SelectItem>
                                            <SelectItem value="excellent">Excellent</SelectItem>
                                            <SelectItem value="good">Good</SelectItem>
                                            <SelectItem value="fair">Fair</SelectItem>
                                            <SelectItem value="poor">Poor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minPrice">Min Price (per day)</Label>
                                    <Input
                                        id="minPrice"
                                        type="number"
                                        placeholder="Min price"
                                        value={localMinPrice}
                                        onChange={(e) => setLocalMinPrice(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxPrice">Max Price (per day)</Label>
                                    <Input
                                        id="maxPrice"
                                        type="number"
                                        placeholder="Max price"
                                        value={localMaxPrice}
                                        onChange={(e) => setLocalMaxPrice(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={localStatus} onValueChange={setLocalStatus}>
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="rented">Rented</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2 md:col-span-2 lg:col-span-3">
                                    <Button onClick={handleSearch} className="flex-1">
                                        Apply Filters
                                    </Button>
                                    <Button variant="outline" onClick={handleClearFilters}>
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>


            {/* Active Filters */}
            {activeFiltersCount > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                            Search: {searchQuery}
                            <button onClick={() => removeFilter("q")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {type && (
                        <Badge variant="secondary" className="gap-1">
                            Type: {type}
                            <button onClick={() => removeFilter("type")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {category && (
                        <Badge variant="secondary" className="gap-1">
                            Category: {formatVehicleCategory(category)}
                            <button type="button" onClick={() => removeFilter("category")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {location && (
                        <Badge variant="secondary" className="gap-1">
                            Location: {location}
                            <button onClick={() => removeFilter("location")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {condition && (
                        <Badge variant="secondary" className="gap-1">
                            Condition: {condition}
                            <button onClick={() => removeFilter("condition")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {(minPrice || maxPrice) && (
                        <Badge variant="secondary" className="gap-1">
                            Price: {minPrice ? `Rs.${minPrice}` : "Rs.0"} - {maxPrice ? `Rs.${maxPrice}` : "∞"}
                            <button onClick={() => {
                                removeFilter("minPrice");
                                removeFilter("maxPrice");
                            }}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {status && status !== "available" && (
                        <Badge variant="secondary" className="gap-1">
                            Status: {status}
                            <button onClick={() => removeFilter("status")}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                </div>
            )}

            {/* Results Count */}
            <div className="mb-4 flex justify-between items-center">
                <p className="text-muted-foreground">
                    {isLoading ? (
                        "Searching..."
                    ) : (
                        <>
                            Found <span className="font-semibold text-foreground">{pagination.total}</span> vehicle{pagination.total !== 1 ? "s" : ""}
                        </>
                    )}
                </p>
            </div>

            {/* Vehicle Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <div className="h-48 bg-muted animate-pulse" />
                            <div className="p-6 space-y-2">
                                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                            </div>
                        </Card>
                    ))}
                </div>
            ) : vehicles.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
                        <p className="text-muted-foreground mb-4">
                            Try adjusting your search criteria or filters
                        </p>
                        <Button variant="outline" onClick={handleClearFilters}>
                            Clear All Filters
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vehicles.map((vehicle) => (
                            <VehicleCard key={vehicle._id} vehicle={vehicle} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-8 flex justify-center gap-2">
                            <Button
                                variant="outline"
                                disabled={pagination.page === 1}
                                onClick={() => {
                                    const currentParams: Record<string, string> = {
                                        q: searchQuery,
                                        type,
                                        category,
                                        minPrice,
                                        maxPrice,
                                        location,
                                        condition,
                                        status,
                                    };
                                    const newPage = Math.max(1, pagination.page - 1);
                                    updateURLParams({ ...currentParams, page: newPage.toString() }, false);
                                }}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => {
                                    const currentParams: Record<string, string> = {
                                        q: searchQuery,
                                        type,
                                        category,
                                        minPrice,
                                        maxPrice,
                                        location,
                                        condition,
                                        status,
                                    };
                                    const newPage = Math.min(pagination.pages, pagination.page + 1);
                                    updateURLParams({ ...currentParams, page: newPage.toString() }, false);
                                }}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

