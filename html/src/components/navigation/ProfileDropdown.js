import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import PGIcon from "../../images/logo.png";

function ProfileDropdown({ userNavigation, handleMenuItemClick }) {
    function classNames(...classes) {
        return classes.filter(Boolean).join(' ');
    }

    return (
        <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
                <span className="sr-only">Open user menu</span>
                <img
                    className="h-8 w-8"
                    src={PGIcon}
                    alt=""
                />
                <span className="hidden lg:flex lg:items-center">
                    <span
                        className="ml-4 text-sm font-semibold leading-6 text-gray-900"
                        aria-hidden="true"
                    >
                        PuppyGraph
                    </span>
                    <ChevronDownIcon
                        className="ml-2 h-5 w-5 text-gray-400"
                        aria-hidden="true"
                    />
                </span>
            </Menu.Button>
            <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                            {({ active }) => (
                                <div
                                    href={item.href}
                                    onClick={(e) => handleMenuItemClick(e, item.name, item.href)}
                                    className={classNames(active ? "bg-gray-50" : "", "block cursor-pointer px-3 py-1 text-sm leading-6 text-gray-900")}
                                >
                                    {item.name}
                                </div>
                            )}
                        </Menu.Item>
                    ))}
                </Menu.Items>
            </Transition>
        </Menu>
    );
}

export default ProfileDropdown;
