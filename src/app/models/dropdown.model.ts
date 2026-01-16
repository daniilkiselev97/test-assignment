export interface DropdownItem {
	label: string,
	value: string
}

export interface DropdownGroup {
	label: string,
	value: string,
	disabled?: boolean,
	items: DropdownItem[]
}

export interface DropdownArea {
	label: string,
	value: string,
	district: string
}

