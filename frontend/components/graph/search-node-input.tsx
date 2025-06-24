import React, { useEffect, useState } from 'react'
import { Input } from '../ui/input'
import { GraphNode } from '@/interfaces/kb'

type Props = {
    nodes: GraphNode[]
    search: string
    setSearch: (search: string) => void
    setSearchResults: (searchResults: GraphNode[]) => void
}

const SearchNodeInput = ({nodes, search, setSearch, setSearchResults}: Props) => {
    const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
    const [numOfResults, setNumOfResults] = useState<number>(0);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (!value.trim()) {
            setSearchResults([]);
            setNumOfResults(0);
            setSearch("");
            return;
        }

        
        setSearch(value);
        setIsSearching(true);
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        const timeout = setTimeout(() => {
          const results = nodes.filter(node => node.name.includes(value));
          setSearchResults(results);
          setNumOfResults(results.length);
          setIsSearching(false);
        }, 1000);

        setDebounceTimeout(timeout);
    }
  return (
    <div className='flex-center gap-2 relative '>
        <Input placeholder="搜索节点" value={search} onChange={handleSearch} className='flex-1 backdrop-blur supports-[backdrop-filter]:bg-background/60' />
        <div className='absolute right-1'>
        {isSearching ? <div className='text-sm text-gray-500 '>搜索中...</div> : <div className='text-sm text-gray-500 '>{numOfResults} 个结果</div>}
        </div>

    </div>
  )
}

export default SearchNodeInput