import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
}

interface Suggestion {
  place_id: string;
  description: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  label = "Address",
  placeholder = "Enter address",
  className = "",
  required = false,
  disabled = false,
  id = "address",
  name = "address"
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 3 || selectedSuggestion === value) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/address-validation/autocomplete?input=${encodeURIComponent(value)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch address suggestions');
        }
        
        const data = await response.json();
        
        if (data.predictions) {
          setSuggestions(data.predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      if (value && value.length >= 3 && selectedSuggestion !== value) {
        fetchSuggestions();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [value, selectedSuggestion]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onChange(suggestion.description);
    setSelectedSuggestion(suggestion.description);
    setShowSuggestions(false);
    
    // Optionally validate the selected address
    validateAddress(suggestion.description);
  };

  const validateAddress = async (address: string) => {
    try {
      const response = await fetch('/api/address-validation/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate address');
      }
      
      const data = await response.json();
      console.log('Validated address:', data);
      // Here you could handle the validated address data if needed
    } catch (error) {
      console.error('Error validating address:', error);
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <Label htmlFor={id} className="mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="relative flex items-center">
          <MapPin className="absolute left-3 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            id={id}
            name={name}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setSelectedSuggestion(null);
            }}
            onFocus={() => value && value.length >= 3 && setShowSuggestions(true)}
            placeholder={placeholder}
            className={`pl-9 ${className}`}
            disabled={disabled}
            required={required}
          />
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
          >
            <ul className="max-h-60 overflow-auto py-2 text-sm">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                >
                  {suggestion.description}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}