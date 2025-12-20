"use client"

import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

interface ImageModalProps {
    isOpen: boolean
    imageSrc: string | null
    onClose: () => void
    alt?: string
}

export function ImageModal({ isOpen, imageSrc, onClose, alt = "Full size image" }: ImageModalProps) {
    const [zoom, setZoom] = useState(1)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

    // Disable scroll when open
    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true)
            setZoom(1)
            setOffset({ x: 0, y: 0 })
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault()
                e.stopPropagation()
                onClose()
            }
            if (e.key === "+" || e.key === "=") {
                e.preventDefault()
                handleZoomIn()
            }
            if (e.key === "-") {
                e.preventDefault()
                handleZoomOut()
            }
        }
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown, true)
        }
        return () => window.removeEventListener("keydown", handleKeyDown, true)
    }, [isOpen, onClose])
    useEffect(() => { if (zoom === 1) setOffset({ x: 0, y: 0 }) }, [zoom])

    // Drag logic
    const startDrag = (x: number, y: number) => {
        if (zoom <= 1) return
        setIsDragging(true)
        setLastPoint({ x, y })
    }

    const continueDrag = (x: number, y: number) => {
        if (!isDragging || !lastPoint) return
        const dx = x - lastPoint.x
        const dy = y - lastPoint.y
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
        setLastPoint({ x, y })
    }

    const endDrag = () => {
        setIsDragging(false)
        setLastPoint(null)
    }

    if (!isOpen || !imageSrc) return null

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
                isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={onClose}
        >
            {/* Image container only has bg */}
            <div
                className={`relative w-[90vw] h-[90vh] max-w-6xl rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${
                    isAnimating ? "scale-100" : "scale-95"
                }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Background only on image container */}
                <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md rounded-2xl" />

                {/* Controls */}
                <div 
                    className="absolute top-4 left-4 right-4 flex items-center justify-between z-20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleZoomOut()
                            }}
                            disabled={zoom <= 0.5}
                            className="p-2.5 rounded-full bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:scale-110 transition disabled:opacity-40 pointer-events-auto"
                            aria-label="Zoom out"
                        >
                            <ZoomOut className="h-5 w-5" />
                        </button>

                        <span className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium border border-white/10 backdrop-blur-md pointer-events-none">
                            {Math.round(zoom * 100)}%
                        </span>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleZoomIn()
                            }}
                            disabled={zoom >= 3}
                            className="p-2.5 rounded-full bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:scale-110 transition disabled:opacity-40 pointer-events-auto"
                            aria-label="Zoom in"
                        >
                            <ZoomIn className="h-5 w-5" />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setZoom(1)
                            }}
                            className="p-2.5 rounded-full bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:scale-110 transition pointer-events-auto"
                            aria-label="Reset zoom"
                        >
                            <Maximize2 className="h-5 w-5" />
                        </button>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                        }}
                        className="p-2.5 rounded-full bg-white/10 text-white border border-white/10 hover:bg-red-500/80 hover:scale-110 transition pointer-events-auto"
                        aria-label="Close image modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Image */}
                <div
                    className={`relative w-full h-full rounded-2xl transition-transform duration-150 ${
                        zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
                    }`}
                    style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }}
                    onMouseDown={e => startDrag(e.clientX, e.clientY)}
                    onMouseMove={e => continueDrag(e.clientX, e.clientY)}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchStart={e => {
                        const t = e.touches[0]
                        if (t) startDrag(t.clientX, t.clientY)
                    }}
                    onTouchMove={e => {
                        const t = e.touches[0]
                        if (t) continueDrag(t.clientX, t.clientY)
                    }}
                    onTouchEnd={endDrag}
                >
                    <Image
                        src={imageSrc}
                        alt={alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 90vw"
                        className="object-contain select-none rounded-2xl"
                        draggable={false}
                        priority
                    />
                </div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium">
                Press ESC to close • +/- to zoom
            </div>
        </div>
    )
}
