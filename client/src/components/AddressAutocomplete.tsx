import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Check, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Type definitions for component props
interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressValidated?: (addressData: ValidatedAddressData) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
}

// Address suggestion from Google Places API
interface Suggestion {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

// Validation status types
type ValidationStatus = 'valid' | 'none';

// Extracted address components for parent components
export interface ValidatedAddressData {
  formattedAddress: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
  validationStatus: ValidationStatus;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressValidated,
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
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('none');
  const [validating, setValidating] = useState(false);
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
        // Try real Google Maps API first
        let response = await fetch(`/api/address-validation/autocomplete?input=${encodeURIComponent(value)}`);
        
        // If API fails, fall back to test mode
        if (!response.ok || response.status !== 200) {
          console.log('Falling back to test mode for autocomplete');
          response = await fetch(`/api/address-validation/autocomplete?input=${encodeURIComponent(value)}&testMode=true`);
          if (!response.ok) {
            throw new Error('Failed to fetch address suggestions');
          }
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
        
        // Reset validation status when user types
        if (validationStatus !== 'none') {
          setValidationStatus('none');
        }
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [value, selectedSuggestion, validationStatus]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onChange(suggestion.description);
    setSelectedSuggestion(suggestion.description);
    setShowSuggestions(false);
    
    // Validate the selected address
    validateAddress(suggestion.description);
  };

  const validateAddress = async (address: string) => {
    setValidating(true);
    try {
      // Try real Google Maps API first
      let response = await fetch('/api/address-validation/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });
      
      // If API fails, fall back to test mode
      if (!response.ok || response.status !== 200) {
        console.log('Falling back to test mode for address validation');
        response = await fetch('/api/address-validation/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ address, testMode: true })
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to validate address');
      }
      
      const data = await response.json();
      
      // Extract formatted address and components
      let formattedAddress = address;
      let postalCode = '';
      let city = '';
      let province = '';
      let country = '';
      
      // Check if the API returned a valid result
      if (data.result && data.result.address) {
        // Set validation status to valid
        setValidationStatus('valid');
        
        // Extract formatted address if available
        if (data.result.address.formattedAddress) {
          formattedAddress = data.result.address.formattedAddress;
        }
        
        // Extract address components
        if (data.result.address.addressComponents) {
          data.result.address.addressComponents.forEach((component: any) => {
            if (component.componentType === 'postal_code') {
              postalCode = component.componentName || '';
            } else if (component.componentType === 'locality') {
              city = component.componentName || '';
            } else if (component.componentType === 'administrative_area_level_1') {
              province = component.componentName || '';
            } else if (component.componentType === 'country') {
              country = component.componentName || '';
            }
          });
        }
        
        // Update the input with the formatted address
        onChange(formattedAddress);
        setSelectedSuggestion(formattedAddress);
        
        // Prepare data to share with parent component
        const addressData: ValidatedAddressData = {
          formattedAddress,
          postalCode,
          city,
          province,
          country,
          validationStatus: 'valid'
        };
        
        // If parent provided a callback, pass the data
        if (onAddressValidated) {
          onAddressValidated(addressData);
        }
      }
    } catch (error) {
      console.error('Error validating address:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleClearInput = () => {
    onChange('');
    setSelectedSuggestion(null);
    setValidationStatus('none');
    setShowSuggestions(false);
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
            className={`pl-9 pr-12 ${className}`}
            disabled={disabled}
            required={required}
          />
          
          <div className="absolute right-3 flex items-center space-x-1">
            {value && (
              <button 
                type="button" 
                onClick={handleClearInput}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
            
            {validationStatus === 'valid' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Address validated and standardized</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {loading && !validating && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
            )}
          </div>
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
      </div>
    </div>
  );
}