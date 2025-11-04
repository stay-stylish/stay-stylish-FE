import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WeatherData {
  location: string
  temperature: number
  precipitation: number
  weather: string
  icon: string
  humidity?: number
  windSpeed?: number
  latitude?: number
  longitude?: number
}

interface StylingData {
  recommendationText: string
  recommendedCategories: string[]
  recommendedLinks: string[]
}

interface WeatherState {
  weatherData: WeatherData | null
  stylingData: StylingData | null
  setWeatherData: (data: WeatherData | null) => void
  setStylingData: (data: StylingData | null) => void
  clearAll: () => void
}

export const useWeather = create<WeatherState>()(
  persist(
    (set) => ({
      weatherData: null,
      stylingData: null,
      setWeatherData: (data) => set({ weatherData: data }),
      setStylingData: (data) => set({ stylingData: data }),
      clearAll: () => set({ weatherData: null, stylingData: null }),
    }),
    {
      name: 'weather-storage',
    }
  )
)
