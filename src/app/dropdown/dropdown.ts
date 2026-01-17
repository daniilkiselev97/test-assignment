import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { DropdownGroup, DropdownItem } from '../models/dropdown.model';

@Component({
  selector: 'dropdown',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dropdown {
  @Input() items: DropdownItem[] = [];
  @Input() groups: DropdownGroup[] = [];
  @Input() placeholder = 'Выберите элемент';
  @Input() mode: 'single' | 'multi' = 'single';
  @Input() enableSearch = false;

  @Output() change = new EventEmitter<string[]>();

  public isOpen = false;
  public selectedValues: string[] = [];
  public searchControl = new FormControl('');

  public filteredItems$!: Observable<DropdownItem[]>;
  public filteredGroups$!: Observable<DropdownGroup[]>;

  constructor(private _el: ElementRef) { }

  ngOnInit(): void {
    this.filteredItems$ = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(''),
      map(term => this.filterItems(term))
    );

    if (this.groups.length) {
      this.filteredGroups$ = this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith(''),
        map(term => this.filterGroups(term))
      );
    }
  }

  private filterItems(term: string | null): DropdownItem[] {
    const t = (term || '').toLowerCase();
    return !t ? [...this.items] : this.items.filter(i => i.label.toLowerCase().includes(t));
  }

  private filterGroups(term: string | null): DropdownGroup[] {
    const t = (term || '').toLowerCase();
    return !t
      ? [...this.groups]
      : this.groups
        .map(group => ({
          ...group,
          items: this.filterGroupItems(group.items, t)
        }))
        .filter(group => group.items.length);
  }

  private filterGroupItems(items: DropdownItem[], term: string): DropdownItem[] {
    return items.filter(item => item.label.toLowerCase().includes(term));
  }


  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent) {
    if (!this._el.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.searchControl.setValue('');
    }
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.searchControl.setValue('');
  }

  public select(item: DropdownItem, disabled = false): void {
    if (disabled) return;

    if (this.mode === 'single') {
      this.selectedValues = [item.value];
      this.isOpen = false;
    } else {
      this.selectedValues = this.selectedValues.includes(item.value)
        ? this.selectedValues.filter(v => v !== item.value)
        : [...this.selectedValues, item.value];
    }

    this.change.emit([...this.selectedValues]);
  }

  public isSelected(value: string): boolean {
    return this.selectedValues.includes(value);
  }

  public getHeaderLabel(): string {
    if (!this.selectedValues.length) return this.placeholder;

    const first = this.items.find(item => item.value === this.selectedValues[0])
      ?? this.groups.flatMap(group => group.items).find(item => item.value === this.selectedValues[0]);

    if (this.selectedValues.length === 1) return first?.label || '';

    return `${first?.label || ''} +${this.selectedValues.length - 1}`;
  }
}
