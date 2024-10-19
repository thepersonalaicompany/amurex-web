"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  MessageCircle,
  User,
  Home,
  Compass,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OnboardingPopup } from "@/components/OnboardingPopup";

export default function PinterestBoard() {
  const [pins, setPins] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [importType, setImportType] = useState(null);

  useEffect(() => {
    const sizes = ["small", "medium", "large"];
    const newPins = [
      {
        id: 1,
        title: "Cozy living room",
        image: "/placeholder.svg?height=300&width=200",
      },
      {
        id: 2,
        title: "Modern kitchen design",
        image: "/placeholder.svg?height=400&width=300",
      },
      {
        id: 3,
        title: "Minimalist workspace",
        image: "/placeholder.svg?height=250&width=200",
      },
      {
        id: 4,
        title: "Rustic bedroom decor",
        image: "/placeholder.svg?height=500&width=300",
      },
      {
        id: 5,
        title: "Elegant bathroom",
        image: "/placeholder.svg?height=300&width=200",
      },
      {
        id: 6,
        title: "Outdoor patio ideas",
        image: "/placeholder.svg?height=400&width=300",
      },
      {
        id: 7,
        title: "DIY home projects",
        image: "/placeholder.svg?height=280&width=200",
      },
      {
        id: 8,
        title: "Colorful art studio",
        image: "/placeholder.svg?height=500&width=300",
      },
      {
        id: 9,
        title: "Scandinavian interior",
        image: "/placeholder.svg?height=360&width=200",
      },
      {
        id: 10,
        title: "Boho chic bedroom",
        image: "/placeholder.svg?height=400&width=300",
      },
      {
        id: 11,
        title: "Vintage home office",
        image: "/placeholder.svg?height=320&width=200",
      },
      {
        id: 12,
        title: "Industrial loft design",
        image: "/placeholder.svg?height=450&width=300",
      },
      {
        id: 13,
        title: "Zen garden ideas",
        image: "/placeholder.svg?height=280&width=200",
      },
      {
        id: 14,
        title: "Coastal living room",
        image: "/placeholder.svg?height=400&width=300",
      },
      {
        id: 15,
        title: "Minimalist bedroom",
        image: "/placeholder.svg?height=350&width=200",
      },
    ].map((pin) => ({
      ...pin,
      size: sizes[Math.floor(Math.random() * sizes.length)],
    }));
    setPins(newPins);
  }, []);

  const handleImportDocs = (type) => {
    setImportType(type);
    // Simulating import of Notion pages
    const importedDocs = [
      {
        id: 16,
        title: "Project Roadmap",
        image: "/notion-page-thumbnail.png",
        type: "notion",
      },
      {
        id: 17,
        title: "Meeting Notes",
        image: "/notion-page-thumbnail.png",
        type: "notion",
      },
      {
        id: 18,
        title: "Product Backlog",
        image: "/notion-page-thumbnail.png",
        type: "notion",
      },
    ];

    const sizes = ["small", "medium", "large"];
    const newPins = importedDocs.map(doc => ({
      ...doc,
      size: sizes[Math.floor(Math.random() * sizes.length)],
    }));

    setPins(prevPins => [...prevPins, ...newPins]);
    setShowOnboarding(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {showOnboarding && (
        <OnboardingPopup
          onClose={() => setShowOnboarding(false)}
          onImport={handleImportDocs}
        />
      )}
      <aside className="w-16 bg-white shadow-md flex flex-col items-center py-4 space-y-8 fixed h-full z-50">
        <span className="text-4xl" role="img" aria-label="Dog emoji">
          🐶
        </span>
        <Button variant="ghost" size="icon">
          <Home className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon">
          <Compass className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon">
          <MessageCircle className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon">
          <Plus className="h-6 w-6" />
        </Button>
      </aside>
      <main
        className="flex-1 overflow-y-auto ml-16"
        style={{ backgroundColor: "#f0f0f0" }}
      >
        <div className="sticky top-0 z-40 bg-gray-100 bg-opacity-90 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto py-4 px-8">
            <Input
              type="search"
              placeholder="Search..."
              className="w-full text-4xl py-4 px-2 font-serif bg-transparent border-0 border-b-2 border-gray-300 rounded-none focus:ring-0 focus:border-gray-500 transition-colors"
              style={{ fontFamily: "'Playfair Display', serif" }}
            />
          </div>
        </div>
        <div className="p-8">
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4">
            {pins.map((pin) => (
              <div
                key={pin.id}
                className={`mb-4 break-inside-avoid ${
                  pin.size === "large"
                    ? "h-[500px]"
                    : pin.size === "medium"
                    ? "h-[400px]"
                    : "h-[300px]"
                }`}
              >
                <div className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out h-full">
                  <img
                    src={pin.image}
                    alt={pin.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <h3
                      className="text-white text-center font-semibold px-2 font-serif text-lg italic"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {pin.title}
                    </h3>
                  </div>
                  {pin.type === "notion" && (
                    <div className="absolute top-2 left-2 bg-white rounded-full p-1">
                      <img
                        src="/notion-icon.png"
                        alt="Notion"
                        className="w-6 h-6"
                      />
                    </div>
                  )}
                  {pin.image.includes('googleusercontent.com') && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                      <img
                        src="https://www.google.com/images/about/docs-icon.svg"
                        alt="Google Docs"
                        className="w-6 h-6"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
