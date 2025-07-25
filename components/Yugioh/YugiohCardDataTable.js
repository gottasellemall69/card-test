// components/Yugioh/YugiohCardDataTable.js
"use client";
import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';
import Notification from '@/components/Notification.js';

const YugiohPagination = dynamic(
    () => import( '@/components/Yugioh/YugiohPagination.js' ),
    { ssr: false }
);

const YugiohCardDataTable = ( { matchedCardData, setMatchedCardData } ) => {
    const router = useRouter();
    const itemsPerPage = 50;
    const [ currentPage, setCurrentPage ] = useState( 1 );
    const [ sortConfig, setSortConfig ] = useState( { key: [], direction: 'ascending' } );
    const [ selectedKeys, setSelectedKeys ] = useState( new Set() );
    const [ lastCheckedKey, setLastCheckedKey ] = useState( null );
    const [ selectAllChecked, setSelectAllChecked ] = useState( false );
    const [ notification, setNotification ] = useState( { show: false, message: '' } );

    // Build base key from card properties (without index)
    const makeKey = ( { card } ) =>
        `${ card?.productName }|${ card?.setName }|${ card?.number }|${ card?.printing }`;

    // 1. Precompute stable unique IDs including duplicate counts for all items in matchedCardData
    const itemUniqueIds = useMemo( () => {
        const counts = {};
        return matchedCardData.map( ( item ) => {
            const baseKey = makeKey( item );
            counts[ baseKey ] = ( counts[ baseKey ] || 0 ) + 1;
            return `${ baseKey }|${ counts[ baseKey ] }`; // e.g. "card|set|num|print|1", "card|set|num|print|2"
        } );
    }, [ matchedCardData ] );

    // 2. Sort matchedCardData with original index retained for referencing unique IDs
    const sortedDataWithIndex = useMemo( () => {
        if ( !Array.isArray( matchedCardData ) ) return [];

        const sorted = [ ...matchedCardData ].map( ( item, index ) => ( { item, originalIndex: index } ) );
        sorted.sort( ( a, b ) => {
            const aValue = sortConfig.key === 'marketPrice'
                ? a.item.data?.marketPrice || 0
                : a.item.card[ sortConfig.key ];
            const bValue = sortConfig.key === 'marketPrice'
                ? b.item.data?.marketPrice || 0
                : b.item.card[ sortConfig.key ];
            if ( aValue < bValue ) return sortConfig.direction === 'ascending' ? -1 : 1;
            if ( aValue > bValue ) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        } );
        return sorted;
    }, [ matchedCardData, sortConfig ] );

    // 3. Pagination slice on sorted data
    const sortedAndPaginatedData = useMemo( () => {
        const indexOfLast = currentPage * itemsPerPage;
        const indexOfFirst = indexOfLast - itemsPerPage;
        const currentItems = sortedDataWithIndex.slice( indexOfFirst, indexOfLast );
        return { currentItems, totalCount: matchedCardData.length };
    }, [ sortedDataWithIndex, currentPage, matchedCardData.length ] );

    // Unique IDs in sorted order (full dataset)
    const sortedUniqueIds = useMemo(
        () => sortedDataWithIndex.map( ( { originalIndex } ) => itemUniqueIds[ originalIndex ] ),
        [ sortedDataWithIndex, itemUniqueIds ]
    );

    // Checkbox toggle with Shift+Click
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

            setSelectedKeys( newSelected );
            setSelectAllChecked( false );
        },
        [ selectedKeys, lastCheckedKey, sortedUniqueIds ]
    );


    // Current page unique IDs
    const pagedUniqueIds = useMemo(
        () => sortedAndPaginatedData.currentItems.map( ( { originalIndex } ) => itemUniqueIds[ originalIndex ] ),
        [ sortedAndPaginatedData, itemUniqueIds ]
    );

    const isAllOnPage = pagedUniqueIds.length > 0 && pagedUniqueIds.every( ( k ) => selectedKeys.has( k ) );

    const handleSelectAllOnPage = () => {
        const newSet = new Set( selectedKeys );
        pagedUniqueIds.forEach( ( k ) => newSet.add( k ) );
        setSelectedKeys( newSet );
    };

    const handleDeselectAllOnPage = () => {
        const newSet = new Set( selectedKeys );
        pagedUniqueIds.forEach( ( k ) => newSet.delete( k ) );
        setSelectedKeys( newSet );
    };

    const handleSelectAllDataset = () => {
        setSelectedKeys( new Set( itemUniqueIds ) );
    };

    const handleClear = () => {
        setSelectedKeys( new Set() );
        setLastCheckedKey( null );
        setSelectAllChecked( false );
    };

    // Sort handler unchanged
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

    // Add to collection logic unchanged except use uniqueId filtering
    const addToCollection = useCallback( async () => {
        if ( selectedKeys.size === 0 ) {
            return setNotification( { show: true, message: 'No cards were selected to add to the collection!' } );
        }
        const token = localStorage.getItem( "token" );
        if ( !token ) {
            setNotification( { show: true, message: "You must be logged in to add cards." } );
            return;
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
            lowPrice: data?.lowPrice,
            quantity: 1,
        } ) );
        try {
            const response = await fetch( `/api/Yugioh/cards`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${ token }`,
                },
                body: JSON.stringify( { cards: collectionArray } ),
            } );
            if ( !response.ok ) throw new Error();
            setNotification( { show: true, message: 'Card(s) added to the collection!' } );
        } catch {
            setNotification( { show: true, message: 'Card(s) failed to save!' } );
        }
    }, [ selectedKeys, matchedCardData, itemUniqueIds ] );

    // Download CSV using uniqueIds filtering
    const downloadCSV = useCallback( () => {
        if ( selectedKeys.size === 0 ) {
            setNotification( { show: true, message: 'No cards selected to download!' } );
            return;
        }
        const headers = [ "Name", "Set", "Number", "Printing", "Rarity", "Condition", "Market Price", "Low Price" ];
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
                data?.lowPrice,
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
    }, [ selectedKeys, matchedCardData, itemUniqueIds ] );

    const handleGoToCollectionPage = useCallback( () => {
        router.push( '/yugioh/my-collection' );
    }, [ router ] );

    return (
        <div className="mx-auto w-full mb-10 min-h-fit">
            <Notification
                show={ notification.show }
                setShow={ ( show ) => setNotification( { ...notification, show } ) }
                message={ notification.message }
            />

            { sortedAndPaginatedData.currentItems.length > 0 && (
                <div>
                    {/* Pagination */ }
                    <div className="w-full -mt-5">
                        <div className="w-fit mx-auto">
                            <YugiohPagination
                                currentPage={ currentPage }
                                itemsPerPage={ itemsPerPage }
                                totalItems={ sortedAndPaginatedData.totalCount }
                                handlePageClick={ setCurrentPage }
                            />
                        </div>

                        {/* Table */ }
                        <div className="w-full mx-auto overflow-x-auto">
                            {/* Bulk Action Bar */ }
                            { selectedKeys.size > 0 && (
                                <div className="my-5 py-2 h-fit bg-stone-500 bg-opacity-20 backdrop-blur backdrop-filter text-white p-2 mb-2 flex justify-between items-center">
                                    <div className="text-sm float-start">
                                        <strong>{ selectedKeys.size }</strong> selected
                                        <button onClick={ handleClear } className="ml-4 underline float-end">Clear</button>
                                        <button onClick={ handleSelectAllDataset } className="ml-4 underline float-end">Select All in Dataset</button>
                                    </div>
                                </div>
                            ) }

                            <table className="min-w-full max-w-7xl text-white items-center border-collapse mx-auto">
                                <thead className="p-1 bg-transparent">
                                    <tr>
                                        <th className="sticky px-1 top-0 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                                            <input
                                                type="checkbox"
                                                checked={ isAllOnPage }
                                                onChange={ ( e ) =>
                                                    e.target.checked ? handleSelectAllOnPage() : handleDeselectAllOnPage()
                                                }
                                            />
                                        </th>
                                        { [
                                            { key: 'productName', label: 'Name' },
                                            { key: 'setName', label: 'Set' },
                                            { key: 'number', label: 'Number' },
                                            { key: 'rarity', label: 'Rarity' },
                                            { key: 'condition', label: 'Condition' },
                                            { key: 'marketPrice', label: 'Market Price' },
                                            { key: 'lowPrice', label: 'Low Price' },
                                        ].map( ( { key, label } ) => (
                                            <th
                                                key={ key }
                                                onClick={ () => handleSort( key ) }
                                                className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter"
                                            >
                                                { label }
                                                { sortConfig.key === key && (
                                                    <span className="ml-1">
                                                        { sortConfig.direction === 'ascending' ? (
                                                            <ChevronUpIcon className="h-2 w-2 text-white font-black inline" />
                                                        ) : (
                                                            <ChevronDownIcon className="h-2 w-2 text-white font-black inline" />
                                                        ) }
                                                    </span>
                                                ) }
                                            </th>
                                        ) ) }
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-300 text-black px-1 py-1 mx-auto">
                                    { sortedAndPaginatedData.currentItems.map( ( { item, originalIndex } ) => {
                                        const uniqueId = itemUniqueIds[ originalIndex ];
                                        const isSelected = selectedKeys.has( uniqueId );
                                        const { card, data } = item;

                                        return (
                                            <tr key={ uniqueId } className="hover:bg-gray-100">
                                                <td className="text-center border border-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={ isSelected }
                                                        onChange={ ( e ) => toggleCheckbox( e, uniqueId ) }
                                                    />
                                                </td>
                                                <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">
                                                    { card?.productName || 'N/A' }
                                                </td>
                                                <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">
                                                    { card?.setName || 'N/A' }
                                                </td>
                                                <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">
                                                    { card?.number || 'N/A' }
                                                </td>
                                                <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">
                                                    { card?.rarity || 'N/A' }
                                                </td>
                                                <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">
                                                    { card?.condition || 'N/A' }
                                                </td>
                                                <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">
                                                    { data?.marketPrice ?? 'N/A' }
                                                </td>
                                                <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left text-black hover:bg-black hover:text-white">
                                                    { data?.lowPrice ?? 'N/A' }
                                                </td>
                                            </tr>
                                        );
                                    } ) }
                                </tbody>
                            </table>
                        </div>

                        <div className="max-h-fit w-full mt-2 flex justify-center space-x-2">
                            <button
                                type="button"
                                className="border border-white rounded-lg px-2 py-2 text-white text-sm font-bold hover:text-black hover:bg-white"
                                onClick={ downloadCSV }
                            >
                                Download CSV
                            </button>
                            <button
                                type="button"
                                className="border border-white rounded-lg px-2 py-2 text-sm text-white font-bold hover:text-black hover:bg-white"
                                onClick={ addToCollection }
                            >
                                Add card(s) to collection
                            </button>
                            <button
                                type="button"
                                className="border border-white rounded-lg px-2 py-2 text-sm text-white font-bold hover:text-black hover:bg-white"
                                onClick={ handleGoToCollectionPage }
                            >
                                View Collection
                            </button>
                        </div>
                    </div>
                </div>
            ) }
        </div>
    );
};

export default YugiohCardDataTable;
