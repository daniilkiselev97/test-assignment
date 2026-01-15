import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dropdown',
  imports: [CommonModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
})
export class Dropdown {
  @Input() items: { label: string, value: string }[] = [];
  @Input() placeholder = 'Выберите элемент';
  @Input() mode: 'single' | 'multi' = 'single'

  @Output() change = new EventEmitter<string[]>();

  @HostListener('document: click', ['$event'])
  onOutsideClick(e: MouseEvent): void {
    if (!this._el.nativeElement.contains(e.target)) {
      this.isOpen = false
    }
  }

  public isOpen = false;
  public selectedValues: string[] = [];

  constructor(private _el: ElementRef) { }

  public toggle(): void {
    this.isOpen = !this.isOpen;
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
    return this.items.filter(i => this.selectedValues.includes(i.value)).map(i => i.label).join(', ')
  }

  public isSelected(item: string): boolean {
    return this.selectedValues.includes(item)
  }
}
