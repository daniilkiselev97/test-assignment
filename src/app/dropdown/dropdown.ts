import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'dropdown',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dropdown {
  @Input() items: { label: string, value: string }[] = [];
  @Input() placeholder = 'Выберите элемент';
  @Input() mode: 'single' | 'multi' = 'single'
  @Input() enableSearch: boolean = false

  @Output() change = new EventEmitter<string[]>();

  @HostListener('document: click', ['$event'])
  onOutsideClick(e: MouseEvent): void {
    if (!this._el.nativeElement.contains(e.target)) {
      this.isOpen = false
    }
  }

  public isOpen = false;
  public selectedValues: string[] = [];
  public searchControl = new FormControl('')

  public get filteredItems() {
    const term = this.searchControl.value?.toLowerCase() || ''
    return !term ? [...this.items] : this.items.filter(i => i.label.toLowerCase().includes(term))
  }

  constructor(private _el: ElementRef) { }


  public toggle(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen && this.enableSearch) {
      this.searchControl.setValue('')
    }
  }

  public select(item: { label: string, value: string }): void {
    if (this.mode === 'single') {
      this.selectedValues = [item.value]
      this.isOpen = false
    } else {
      if (this.selectedValues.includes(item.value)) {
        this.selectedValues = this.selectedValues.filter(v => v !== item.value)
      } else {
        this.selectedValues = [...this.selectedValues, item.value]
      }
    }
    this.change.emit([...this.selectedValues])
  }

  public getHeaderLabel(): string {
    if (!this.selectedValues.length) return this.placeholder
    if (this.selectedValues.length === 1) {
      const item = this.items.find(i => i.value === this.selectedValues[0])
      return item?.label || ''
    }
    const firstItem = this.items.find(i => i.value === this.selectedValues[0])
    const otherCounts = this.selectedValues.length - 1
    return `${firstItem?.label || ''} +${otherCounts}`
  }

  public isSelected(item: string): boolean {
    return this.selectedValues.includes(item)
  }
}
