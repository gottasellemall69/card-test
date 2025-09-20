// components/Yugioh/YugiohCardDataTable.js
"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';
import Notification from '@/components/Notification.js';
import cardData from '@/public/card-data/Yugioh/card_data.json';
import { buildCollectionMap } from '@/utils/collectionUtils.js';

const YugiohPagination = dynamic(
    () => import( '@/components/Yugioh/YugiohPagination.js' ),
    { ssr: false }
);

const YugiohCardDataTable = ( {
    matchedCardData,
    setMatchedCardData,
    selectedRowIds,
    setSelectedRowIds,
    collectionMap
} ) => {
    const router = useRouter();
    const itemsPerPage = 50;
    const [ currentPage, setCurrentPage ] = useState( 1 );
    const [ sortConfig, setSortConfig ] = useState( { key: [], direction: 'ascending' } );
    const [ selectedKeys, setSelectedKeys ] = useState( new Set() );
    const [ lastCheckedKey, setLastCheckedKey ] = useState( null );
    const [ notification, setNotification ] = useState( { show: false, message: '' } );
    const [ internalCollection, setInternalCollection ] = useState( {} );

    const cardIndex = useMemo( () => {
        const map = {};
        cardData.forEach( ( entry ) => {
            map[ entry.name.toLowerCase() ] = entry;
        } );
        return map;
    }, [] );

    const resolvedCollection = useMemo( () => {
        if ( collectionMap ) return collectionMap;
        return internalCollection;
    }, [ collectionMap, internalCollection ] );

    useEffect( () => {
        if ( collectionMap || internalCollection.__hydrated ) return;

        const fetchCollection = async () => {
            try {
                const response = await fetch( '/api/Yugioh/my-collection', {
                    method: 'GET',
                    credentials: 'include'
                } );
                if ( !response.ok ) {
                    setInternalCollection( { __hydrated: true } );
                    return;
                }
                const data = await response.json();
                const map = buildCollectionMap( data );
                map.__hydrated = true;
                setInternalCollection( map );
            } catch ( error ) {
                console.error( 'Failed to load collection for indicator:', error );
                setInternalCollection( { __hydrated: true } );
            }
        };

        fetchCollection();
    }, [ collectionMap, internalCollection.__hydrated ] );

    const makeKey = useCallback( ( item ) => {
        if ( item?.collectionKey ) return item.collectionKey;
        const card = item?.card || {};
        return `${ card?.productName }|${ card?.setName }|${ card?.number }|${ card?.printing }`;
    }, [] );

    const baseKeys = useMemo( () =>
        matchedCardData.map( ( item ) => makeKey( item ) ),
        [ matchedCardData, makeKey ] );

    const itemUniqueIds = useMemo( () => {
        const counts = {};
        return matchedCardData.map( ( item ) => {
            const baseKey = makeKey( item );
            counts[ baseKey ] = ( counts[ baseKey ] || 0 ) + 1;
            return `${ baseKey }|${ counts[ baseKey ] }`;
        } );
    }, [ matchedCardData, makeKey ] );

    useEffect( () => {
        if ( !selectedRowIds ) return;
        const nextSet = new Set();
        baseKeys.forEach( ( key, index ) => {
            if ( selectedRowIds[ key ] ) {
                nextSet.add( itemUniqueIds[ index ] );
            }
        } );
        setSelectedKeys( nextSet );
    }, [ selectedRowIds, baseKeys, itemUniqueIds ] );

    const applySelectionSet = useCallback( ( newSet ) => {
        setSelectedKeys( newSet );
        if ( setSelectedRowIds ) {
            setSelectedRowIds( () => {
                const next = {};
                baseKeys.forEach( ( key, index ) => {
                    if ( newSet.has( itemUniqueIds[ index ] ) ) {
                        next[ key ] = true;
                    }
                } );
                return next;
            } );
        }
    }, [ baseKeys, itemUniqueIds, setSelectedRowIds ] );

    const sortedDataWithIndex = useMemo( () => {
        if ( !Array.isArray( matchedCardData ) ) return [];
        const sorted = [ ...matchedCardData ].map( ( item, index ) => ( { item, originalIndex: index } ) );
        sorted.sort( ( a, b ) => {
            const aValue = sortConfig.key === 'marketPrice'
                ? parseFloat( a.item.data?.marketPrice ) || 0
                : a.item.card[ sortConfig.key ];
            const bValue = sortConfig.key === 'marketPrice'
                ? parseFloat( b.item.data?.marketPrice ) || 0
                : b.item.card[ sortConfig.key ];
            if ( aValue < bValue ) return sortConfig.direction === 'ascending' ? -1 : 1;
            if ( aValue > bValue ) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        } );
        return sorted;
    }, [ matchedCardData, sortConfig ] );

    const sortedAndPaginatedData = useMemo( () => {
        const indexOfLast = currentPage * itemsPerPage;
        const indexOfFirst = indexOfLast - itemsPerPage;
        const currentItems = sortedDataWithIndex.slice( indexOfFirst, indexOfLast );
        return { currentItems, totalCount: matchedCardData.length };
    }, [ sortedDataWithIndex, currentPage, matchedCardData.length ] );

    const sortedUniqueIds = useMemo(
        () => sortedDataWithIndex.map( ( { originalIndex } ) => itemUniqueIds[ originalIndex ] ),
        [ sortedDataWithIndex, itemUniqueIds ]
    );

    const toggleCheckbox = useCallback(
        ( e, uniqueId ) => {
            const isShift = e.nativeEvent.shiftKey;
            const newSelected = new Set( selectedKeys );

            if ( isShift && lastCheckedKey !== null && sortedUniqueIds.length ) {
                const start = sortedUniqueIds.indexOf( lastCheckedKey );
                const end = sortedUniqueIds.indexOf( uniqueId );
                if ( start !== -1 && end !== -1 ) {
                    const [ lo, hi ] = start < end ? [ start, end ] : [ end, start ];
                    for ( let i = lo; i <= hi; i++ ) {
                        newSelected.add( sortedUniqueIds[ i ] );
                    }
                }
            } else {
                if ( newSelected.has( uniqueId ) ) newSelected.delete( uniqueId );
                else newSelected.add( uniqueId );
                setLastCheckedKey( uniqueId );
            }

            applySelectionSet( newSelected );
        },
        [ selectedKeys, lastCheckedKey, sortedUniqueIds, applySelectionSet ]
    );

    const pagedUniqueIds = useMemo(
        () => sortedAndPaginatedData.currentItems.map( ( { originalIndex } ) => itemUniqueIds[ originalIndex ] ),
        [ sortedAndPaginatedData, itemUniqueIds ]
    );

    const handleSelectAllOnPage = () => {
        const newSet = new Set( selectedKeys );
        pagedUniqueIds.forEach( ( k ) => newSet.add( k ) );
        applySelectionSet( newSet );
    };

    const handleDeselectAllOnPage = () => {
        const newSet = new Set( selectedKeys );
        pagedUniqueIds.forEach( ( k ) => newSet.delete( k ) );
        applySelectionSet( newSet );
    };

    const handleSelectAllDataset = () => {
        const newSet = new Set( itemUniqueIds );
        applySelectionSet( newSet );
    };

    const handleClear = () => {
        applySelectionSet( new Set() );
        setLastCheckedKey( null );
    };

    const isAllOnPage = pagedUniqueIds.length > 0 && pagedUniqueIds.every( ( k ) => selectedKeys.has( k ) );

    const handleSort = useCallback(
        ( key ) => {
            setSortConfig( ( prev ) => {
                let direction = 'ascending';
                if ( prev.key === key && prev.direction === 'ascending' ) {
                    direction = 'descending';
                }
                return { key, direction };
            } );
            setCurrentPage( 1 );
        },
        []
    );

    const addToCollection = useCallback( async () => {
        if ( selectedKeys.size === 0 ) {
            return setNotification( {
                show: true,
                message: "No cards were selected to add to the collection!",
            } );
        }

        const selectedData = matchedCardData.filter( ( _, index ) =>
            selectedKeys.has( itemUniqueIds[ index ] )
        );

        const collectionArray = selectedData.map( ( { card, data } ) => ( {
            productName: card?.productName,
            setName: card?.setName,
            number: card?.number,
            printing: card?.printing,
            rarity: card?.rarity,
            condition: card?.condition,
            marketPrice: data?.marketPrice,
            quantity: 1,
        } ) );

        try {
            const response = await fetch( `/api/Yugioh/cards`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify( { cards: collectionArray } ),
            } );

            if ( !response.ok ) throw new Error();
            setNotification( {
                show: true,
                message: "Card(s) added to the collection!",
            } );
        } catch {
            setNotification( {
                show: true,
                message: "Card(s) failed to save! Are you logged in?",
            } );
        }
    }, [ selectedKeys, matchedCardData, itemUniqueIds ] );

    const downloadCSV = useCallback( () => {
        if ( selectedKeys.size === 0 ) {
            setNotification( { show: true, message: 'No cards selected to download!' } );
            return;
        }
        const headers = [ "Name", "Set", "Number", "Printing", "Rarity", "Condition", "Market Price" ];
        const rows = matchedCardData
            .filter( ( _, index ) => selectedKeys.has( itemUniqueIds[ index ] ) )
            .map( ( { card, data } ) => [
                card?.productName,
                card?.setName,
                card?.number,
                card?.printing,
                card?.rarity,
                card?.condition,
                data?.marketPrice,
            ] );
        const csvBody = headers.join( "|" ) + "\n" +
            rows.map( ( r ) => r.map( ( v ) => `"${ v }"` ).join( "|" ) ).join( "\n" );
        const blob = new Blob( [ "\uFEFF" + csvBody ], { type: "text/csv;charset=utf-8;" } );
        const url = URL.createObjectURL( blob );
        const link = document.createElement( "a" );
        link.href = url;
        link.download = "yugioh_card_prices.csv";
        document.body.appendChild( link );
        link.click();
        document.body.removeChild( link );
        URL.revokeObjectURL( url );
    }, [ selectedKeys, matchedCardData, setMatchedCardData, itemUniqueIds ] );

    const handleGoToCollectionPage = useCallback( () => {
        router.push( '/yugioh/my-collection' );
    }, [ router ] );

    const formatPrice = ( val ) => {
        const num = parseFloat( val );
        return isNaN( num ) ? "0.00" : `${ num.toFixed( 2 ) }`;
    };

    const resolveCardId = useCallback( ( name ) => {
        if ( !name ) return null;
        const entry = cardIndex[ name.toLowerCase() ];
        return entry?.id || null;
    }, [ cardIndex ] );

    const handleRowNavigation = useCallback( ( card, data ) => {
        if ( !card ) return;
        const cardId = resolveCardId( card.productName );
        const letter = card?.setName?.charAt( 0 ).toUpperCase() || card?.productName?.charAt( 0 ).toUpperCase();

        if ( cardId ) {
            router.push( {
                pathname: '/yugioh/sets/[letter]/cards/card-details',
                query: {
                    card: cardId,
                    letter,
                    set_name: card?.setName,
                    set_code: card?.number,
                    rarity: card?.rarity,
                    edition: card?.printing,
                    source: 'set'
                }
            } );
            return;
        }

        router.push( {
            pathname: '/yugioh/sets/[letter]/cards/card-details',
            query: {
                letter,
                set_name: card?.setName,
                set_code: card?.number,
                rarity: card?.rarity,
                edition: card?.printing,
                productName: card?.productName,
                marketPrice: data?.marketPrice,
                source: 'set'
            }
        } );
    }, [ resolveCardId, router ] );

    const headers = useMemo( () => [
        { key: 'productName', label: 'Card Name' },
        { key: 'setName', label: 'Set Name' },
        { key: 'number', label: 'Number' },
        { key: 'printing', label: 'Printing' },
        { key: 'rarity', label: 'Rarity' },
        { key: 'condition', label: 'Condition' },
        { key: 'marketPrice', label: 'Market Price' },
    ], [] );

    return (
        <div className="mx-auto w-full mb-10 min-h-fit z-50">
            <Notification
                show={ notification.show }
                setShow={ ( show ) => setNotification( { ...notification, show } ) }
                message={ notification.message }
            />

            { sortedAndPaginatedData.currentItems.length > 0 && (
                <div>
                    <div className="w-full -mt-5">
                        <div className="w-fit mx-auto">
                            <YugiohPagination
                                currentPage={ currentPage }
                                itemsPerPage={ itemsPerPage }
                                totalItems={ sortedAndPaginatedData.totalCount }
                                handlePageClick={ setCurrentPage }
                            />
                        </div>
                        <div className="max-h-fit w-full mt-4 flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={ downloadCSV }
                            >
                                Download CSV
                            </button>
                            <button
                                type="button"
                                className="button-primary"
                                onClick={ addToCollection }
                            >
                                Add card(s) to collection
                            </button>
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={ handleGoToCollectionPage }
                            >
                                View Collection
                            </button>
                        </div>

                        <div className="w-full mx-auto overflow-x-auto mt-4 table-container">
                            { selectedKeys.size > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3 text-sm text-indigo-100">
                                    <div>
                                        <strong>{ selectedKeys.size }</strong> selected
                                    </div>
                                    <div className="flex gap-3 text-xs uppercase tracking-wide">
                                        <button onClick={ handleClear } className="text-indigo-200 transition hover:text-white">Clear</button>
                                        <button onClick={ handleSelectAllDataset } className="text-indigo-200 transition hover:text-white">Select All</button>
                                    </div>
                                </div>
                            ) }

                            <table className="min-w-full max-w-7xl text-white border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-xs uppercase tracking-wide text-white/80">
                                        <th className="p-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={ isAllOnPage }
                                                onChange={ ( e ) =>
                                                    e.target.checked ? handleSelectAllOnPage() : handleDeselectAllOnPage()
                                                }
                                            />
                                        </th>
                                        <th className="p-3 text-left">Status</th>
                                        { headers.map( ( { key, label } ) => (
                                            <th
                                                key={ key }
                                                onClick={ () => handleSort( key ) }
                                                className="p-3 text-left cursor-pointer select-none"
                                            >
                                                <span className="inline-flex items-center gap-1">
                                                    { label }
                                                    { sortConfig.key === key && (
                                                        sortConfig.direction === 'ascending' ? (
                                                            <ChevronUpIcon className="h-3.5 w-3.5 text-indigo-200" />
                                                        ) : (
                                                            <ChevronDownIcon className="h-3.5 w-3.5 text-indigo-200" />
                                                        )
                                                    ) }
                                                </span>
                                            </th>
                                        ) ) }
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-white/5">
                                    { sortedAndPaginatedData.currentItems.map( ( { item, originalIndex } ) => {
                                        const uniqueId = itemUniqueIds[ originalIndex ];
                                        const isSelected = selectedKeys.has( uniqueId );
                                        const { card, data } = item;
                                        const collectionKey = baseKeys[ originalIndex ];
                                        const inCollection = Boolean( resolvedCollection?.[ collectionKey ] );

                                        return (
                                            <tr
                                                key={ uniqueId }
                                                className={ `interactive-row ${ isSelected ? 'bg-indigo-500/10' : '' }` }
                                                onClick={ ( event ) => {
                                                    if ( event.target.closest && event.target.closest( 'input,button,a,label,svg,path' ) ) {
                                                        return;
                                                    }
                                                    handleRowNavigation( card, data );
                                                } }
                                            >
                                                <td className="p-3 align-middle">
                                                    <input
                                                        type="checkbox"
                                                        checked={ isSelected }
                                                        onChange={ ( e ) => toggleCheckbox( e, uniqueId ) }
                                                        onClick={ ( e ) => e.stopPropagation() }
                                                    />
                                                </td>
                                                <td className="p-3 align-middle text-xs">
                                                    { inCollection ? (
                                                        <span className="badge badge-success inline-flex items-center gap-1">
                                                            <CheckCircleIcon className="h-3.5 w-3.5" />
                                                            In Collection
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm italic badge text-white/60 border-white/10">Unowned</span>
                                                    ) }
                                                </td>
                                                <td className="p-3 align-middle text-sm font-medium text-white/90">{ card?.productName || 'N/A' }</td>
                                                <td className="p-3 align-middle text-sm text-white/70">{ card?.setName || 'N/A' }</td>
                                                <td className="p-3 align-middle text-sm text-white/70">{ card?.number || 'N/A' }</td>
                                                <td className="p-3 align-middle text-sm text-white/70">{ card?.printing || 'N/A' }</td>
                                                <td className="p-3 align-middle text-sm text-white/70">{ card?.rarity || 'N/A' }</td>
                                                <td className="p-3 align-middle text-sm text-white/70">{ card?.condition || `${ card?.condition } ${ card?.printing }` }</td>
                                                <td className="p-3 align-middle text-sm text-white/90">${ formatPrice( data?.marketPrice ) }</td>
                                            </tr>
                                        );
                                    } ) }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) }
        </div>
    );
};

export default YugiohCardDataTable;

