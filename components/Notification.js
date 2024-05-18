import React, {useState, useEffect} from 'react'
import {XMarkIcon} from '@heroicons/react/20/solid'

const Notification=({show, setShow, message}) => {
  useEffect(() => {
    if(show) {
      const timer=setTimeout(() => setShow(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [show, setShow])

  return (
    <div
      aria-live="assertive"
      className={`pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 transition duration-300 ${ show? 'opacity-100 translate-y-0 sm:translate-x-0':'opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-2' }`}
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex w-0 flex-1 justify-between">
                <p className="w-0 flex-1 text-sm font-medium text-gray-900">{message}</p>
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setShow(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notification
