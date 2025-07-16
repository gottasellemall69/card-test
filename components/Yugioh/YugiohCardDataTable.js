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
    const itemsPerPage = 30;
    const [ currentPage, setCurrentPage ] = useState( 1 );
    const [ sortConfig, setSortConfig ] = useState( { key: [], direction: 'ascending' } );
    const [ selectedKeys, setSelectedKeys ] = useState( new Set() );
    const [ lastCheckedKey, setLastCheckedKey ] = useState( null );
    const [ selectAllChecked, setSelectAllChecked ] = useState( false );
    const [ notification, setNotification ] = useState( { show: false, message: '' } );

    // sort handler unchanged
    const handleSort = useCallback(
        ( key ) => {
            setSortConfig( ( prev ) => {
                let direction = 'ascending';
                if ( prev.key === key && prev.direction === 'ascending' ) {
                    direction = 'descending';
                }
                setMatchedCardData( ( prevData ) => {
                    const sorted = [ ...prevData ].sort( ( a, b ) => {
                        const aValue =
                            key === 'marketPrice' ? a.data?.marketPrice || 0 : a.card[ key ];
                        const bValue =
                            key === 'marketPrice' ? b.data?.marketPrice || 0 : b.card[ key ];
                        if ( aValue < bValue ) return direction === 'ascending' ? -1 : 1;
                        if ( aValue > bValue ) return direction === 'ascending' ? 1 : -1;
                        return 0;
                    } );
                    return sorted;
                } );
                return { key, direction };
            } );
        },
        [ setMatchedCardData ]
    );

    // sorted & paginated
    const sortedAndPaginatedData = useMemo( () => {
        if ( !Array.isArray( matchedCardData ) ) {
            return { currentItems: [], totalCount: 0 };
        }
        // full sort
        const sortedData = [ ...matchedCardData ].sort( ( a, b ) => {
            const aValue =
                sortConfig.key === 'marketPrice'
                    ? a.data?.marketPrice || 0
                    : a.card[ sortConfig.key ];
            const bValue =
                sortConfig.key === 'marketPrice'
                    ? b.data?.marketPrice || 0
                    : b.card[ sortConfig.key ];
            if ( aValue < bValue ) return sortConfig.direction === 'ascending' ? -1 : 1;
            if ( aValue > bValue ) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        } );
        const indexOfLast = currentPage * itemsPerPage;
        const indexOfFirst = indexOfLast - itemsPerPage;
        const currentItems = sortedData.slice( indexOfFirst, indexOfLast );
        return { currentItems, totalCount: sortedData.length };
    }, [ matchedCardData, currentPage, sortConfig ] );

    // build unique rowKey
    const makeKey = ( { card } ) =>
        `${ card?.productName }|${ card?.setName }|${ card?.number }|${ card?.printing }`;

    // checkbox toggle with Shift+Click
    const toggleCheckbox = useCallback(
        ( e, rowKey ) => {
            const isShift = e.nativeEvent.shiftKey;
            const newSelected = new Set( selectedKeys );

            if ( isShift && lastCheckedKey !== null ) {
                // determine range in the full sorted list
                const fullKeys = matchedCardData.map( ( item ) => makeKey( item ) );
                const start = fullKeys.indexOf( lastCheckedKey );
                const end = fullKeys.indexOf( rowKey );
                const [ lo, hi ] = start < end ? [ start, end ] : [ end, start ];
                for ( let i = lo; i <= hi; i++ ) {
                    newSelected.add( fullKeys[ i ] );
                }
            } else {
                if ( newSelected.has( rowKey ) ) newSelected.delete( rowKey );
                else newSelected.add( rowKey );
                setLastCheckedKey( rowKey );
            }

            setSelectedKeys( newSelected );
            setSelectAllChecked( false );
        },
        [ selectedKeys, lastCheckedKey, matchedCardData ]
    );

    // Select All / Deselect All logic
    const pagedKeys = useMemo(
        () => sortedAndPaginatedData.currentItems.map( ( item ) => makeKey( item ) ),
        [ sortedAndPaginatedData ]
    );

    const isAllOnPage = pagedKeys.every( ( k ) => selectedKeys.has( k ) );

    const toggleSelectAll = useCallback( () => {
        if ( !selectAllChecked ) {
            // select all dataset
            const all = matchedCardData.map( ( item ) => makeKey( item ) );
            setSelectedKeys( new Set( all ) );
        } else {
            setSelectedKeys( new Set() );
        }
        setSelectAllChecked( ( f ) => !f );
    }, [ selectAllChecked, matchedCardData ] );

    const handleSelectAllOnPage = () => {
        const newSet = new Set( selectedKeys );
        pagedKeys.forEach( ( k ) => newSet.add( k ) );
        setSelectedKeys( newSet );
    };

    const handleDeselectAllOnPage = () => {
        const newSet = new Set( selectedKeys );
        pagedKeys.forEach( ( k ) => newSet.delete( k ) );
        setSelectedKeys( newSet );
    };

    const handleSelectAllDataset = () => {
        const all = matchedCardData.map( ( item ) => makeKey( item ) );
        setSelectedKeys( new Set( all ) );
    };

    const handleClear = () => {
        setSelectedKeys( new Set() );
        setLastCheckedKey( null );
        setSelectAllChecked( false );
    };

    // Collection + CSV logic unchanged
    const addToCollection = useCallback( async () => {
        if ( selectedKeys.size === 0 ) {
            return setNotification( { show: true, message: 'No cards were selected to add to the collection!' } );
        }
        const token = localStorage.getItem( "token" );
        if ( !token ) {
            setNotification( { show: true, message: "You must be logged in to add cards." } );
            return;
        }
        const selectedData = matchedCardData.filter( ( _, idx ) =>
            selectedKeys.has( makeKey( matchedCardData[ idx ] ) )
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
    }, [ selectedKeys, matchedCardData ] );

    const downloadCSV = useCallback( () => {
        if ( selectedKeys.size === 0 ) {
            setNotification( { show: true, message: 'No cards selected to download!' } );
            return;
        }
        const headers = [ "Name", "Set", "Number", "Printing", "Rarity", "Condition", "Market Price", "Low Price" ];
        const rows = matchedCardData
            .filter( ( _, idx ) => selectedKeys.has( makeKey( matchedCardData[ idx ] ) ) )
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
    }, [ selectedKeys, matchedCardData ] );

    const handleGoToCollectionPage = useCallback( () => {
        router.push( '/yugioh/my-collection' );
    }, [ router ] );

    return (
        <div className="mx-auto w-full mb-10 min-h-max">
            <Notification
                show={ notification.show }
                setShow={ ( show ) => setNotification( { ...notification, show } ) }
                message={ notification.message }
            />

            { sortedAndPaginatedData.currentItems.length > 0 && (
                <>


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
                                    { sortedAndPaginatedData.currentItems.map( ( item, idx ) => {
                                        const rowKey = makeKey( item );
                                        const isSelected = selectedKeys.has( rowKey );
                                        const { card, data } = item;

                                        return (
                                            <tr key={ rowKey } className="hover:bg-gray-100">
                                                <td className="text-center border border-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={ isSelected }
                                                        onChange={ ( e ) => toggleCheckbox( e, rowKey ) }
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
                </>
            ) }
        </div>
    );
};

export default YugiohCardDataTable;
