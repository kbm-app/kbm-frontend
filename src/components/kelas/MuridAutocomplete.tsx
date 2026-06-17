'use client'

import { useState, useRef } from 'react'
import { useMuridList } from '@/hooks/useMurid'
import { useDebounce } from '@/hooks/useDebounce'
import { Murid } from '@/types/murid'
import { AvatarInitial } from '@/components/ui/avatar-initial'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'

interface MuridAutocompleteProps {
  onSelect: (murid: Murid) => void
  selectedId?: number
  defaultInputValue?: string
  error?: string
  placeholder?: string
  tanpaKelas?: boolean
}

export function MuridAutocomplete({
  onSelect,
  selectedId,
  defaultInputValue,
  error,
  placeholder = 'Ketik nama murid untuk mencari...',
  tanpaKelas,
}: MuridAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultInputValue ?? '')
  const debouncedSearch = useDebounce(inputValue)

  const { data: muridData, isFetching } = useMuridList({
    search: debouncedSearch || undefined,
    status: 'aktif',
    tanpa_kelas: tanpaKelas,
  })

  const lastListRef = useRef<Murid[]>([])
  if (muridData?.data) lastListRef.current = muridData.data
  const muridList = muridData?.data ?? lastListRef.current

  return (
    <AutocompleteInput
      items={muridList}
      isFetching={isFetching}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSelect={onSelect}
      getLabel={(m) => m.nama}
      getId={(m) => m.id}
      selectedId={selectedId}
      error={error}
      placeholder={placeholder}
      inputClassName="h-8 px-2.5"
      emptyText="Ketik nama untuk mencari"
      notFoundText="Murid tidak ditemukan"
      renderItem={(m) => (
        <>
          <AvatarInitial name={m.nama} size="md" />
          <span className="flex-1">{m.nama}</span>
        </>
      )}
    />
  )
}
