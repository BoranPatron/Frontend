import React, { useEffect, useMemo, useRef, useState } from 'react';
import { searchAddresses, type AddressSuggestion, formatSuggestionForDisplay } from '../api/addressService';
import { Search, MapPin } from 'lucide-react';

type AddressAutocompleteProps = {
	label?: string;
	placeholder?: string;
	value: {
		address_street: string;
		address_zip: string;
		address_city: string;
		address_country?: string;
	};
	onChange: (next: { address_street: string; address_zip: string; address_city: string; address_country?: string }) => void;
	className?: string;
};

export default function AddressAutocomplete({ label = 'Adresse', placeholder = 'Adresse eingeben…', value, onChange, className }: AddressAutocompleteProps) {
	const [inputValue, setInputValue] = useState<string>([value.address_street, value.address_zip && value.address_city ? `${value.address_zip} ${value.address_city}` : value.address_city].filter(Boolean).join(', '));
	const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState<number>(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const debounceRef = useRef<number | null>(null);

	useEffect(() => {
		// sync outer changes into input if parent changes value
		setInputValue([value.address_street, value.address_zip && value.address_city ? `${value.address_zip} ${value.address_city}` : value.address_city].filter(Boolean).join(', '));
	}, [value.address_street, value.address_zip, value.address_city]);

	const fetchSuggestions = async (q: string) => {
		if (!q || q.trim().length < 3) {
			setSuggestions([]);
			return;
		}
		try {
			setLoading(true);
			const res = await searchAddresses(q);
			setSuggestions(res);
			setOpen(true);
		} catch (e) {
			console.error('Adresssuche fehlgeschlagen:', e);
			setSuggestions([]);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const q = e.target.value;
		setInputValue(q);
		if (debounceRef.current) window.clearTimeout(debounceRef.current);
		// 250ms Debounce für Performance
		debounceRef.current = window.setTimeout(() => {
			void fetchSuggestions(q);
		}, 250);
	};

	const selectSuggestion = (s: AddressSuggestion) => {
		const streetLine = [s.street, s.houseNumber].filter(Boolean).join(' ').trim();
		onChange({
			address_street: streetLine,
			address_zip: s.zip || '',
			address_city: s.city || '',
			address_country: s.country || value.address_country,
		});
		setInputValue(formatSuggestionForDisplay(s));
		setOpen(false);
		setSuggestions([]);
		setHighlightIndex(-1);
	};

	useEffect(() => {
		const onClickOutside = (ev: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', onClickOutside);
		return () => document.removeEventListener('mousedown', onClickOutside);
	}, []);

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
			setOpen(true);
			return;
		}
		if (!open) return;
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
				break;
			case 'ArrowUp':
				e.preventDefault();
				setHighlightIndex((i) => Math.max(i - 1, 0));
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightIndex >= 0 && suggestions[highlightIndex]) {
					selectSuggestion(suggestions[highlightIndex]);
				}
				break;
			case 'Escape':
				setOpen(false);
				break;
		}
	};

	return (
		<div ref={containerRef} className={className}>
			{label && (
				<label className="block text-sm font-semibold text-gray-200 mb-3">{label}</label>
			)}
			<div className="relative">
				<input
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={onKeyDown}
					placeholder={placeholder}
					className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
				/>
				<Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />

				{open && suggestions.length > 0 && (
					<ul className="absolute z-50 mt-2 w-full max-h-60 overflow-auto bg-[#1a1a2e] border border-gray-700 rounded-xl shadow-2xl">
						{suggestions.map((s, idx) => (
							<li
								key={s.id}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => selectSuggestion(s)}
								onMouseEnter={() => setHighlightIndex(idx)}
								className={`px-3 py-2 cursor-pointer flex items-start gap-2 ${highlightIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'}`}
							>
								<MapPin className="w-4 h-4 text-[#ffbd59] mt-0.5" />
								<div className="text-sm">
									<div className="text-white">{s.label}</div>
									<div className="text-gray-400 text-xs">{formatSuggestionForDisplay(s)}</div>
								</div>
							</li>
						))}
					</ul>
				)}

				{loading && (
					<div className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-gray-400">Suchen…</div>
				)}
			</div>
		</div>
	);
}


