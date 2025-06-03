"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Palette } from "lucide-react"

interface HexColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function HexColorPicker({ color, onChange }: HexColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "") {
      onChange(value.startsWith("#") ? value : `#${value}`)
    }
  }

  const presetColors = [
    "#ffffff",
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#00ffff",
    "#ff00ff",
    "#f5f5f5",
    "#808080",
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-md border cursor-pointer relative z-10"
          style={{ backgroundColor: color }}
          onClick={() => setIsOpen(true)}
        />
        <Input value={color} onChange={handleInputChange} className="w-28 font-mono" maxLength={7} />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button className="rounded-md p-2 hover:bg-muted relative z-10">
              <Palette className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 z-50">
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((presetColor) => (
                <div
                  key={presetColor}
                  className="h-8 w-8 cursor-pointer rounded-md border transition-transform hover:scale-110"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    onChange(presetColor)
                    setIsOpen(false)
                  }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
