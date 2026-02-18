"use client"

import { useRef, useEffect } from "react"

export function AuthVideo() {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.75
        }
    }, [])

    return (
        <div className="relative h-full w-full bg-[#25468d] overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover opacity-90"
                poster="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2940&auto=format&fit=crop"
            >
                <source src="/videos/auth.mp4" type="video/mp4" />
                <source src="/videos/auth.webm" type="video/webm" />
                Your browser does not support the video tag.
            </video>

            <div className="absolute inset-0 bg-[#25468d]/20" />
        </div>
    )
}
