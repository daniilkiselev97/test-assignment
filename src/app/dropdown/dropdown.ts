import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { DropdownGroup, DropdownItem, DropdownMode, FlatItem } from '../models/dropdown.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  @Input() mode: DropdownMode = 'single';
  @Input() enableSearch = false;
  @Input() selectedInput$!: Observable<string[]>
  @Input() selectedValues: string[] = []

  @Output() change = new EventEmitter<string[]>();

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.searchControl.setValue('');
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const items = this.flatItems;
    const length = items.length;
    if (!length) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        this.moveActiveIndex(1)
        event.preventDefault();
        break;

      case 'ArrowUp':
        this.moveActiveIndex(-1)
        event.preventDefault();
        break;

      case 'Enter':
      case ' ':
        if (this.isOpen && this.activeIndex >= 0) {

          const item = items[this.activeIndex];
          if (!item.disabled) this.select(item);
        } else {
          this.toggle();
        }
        event.preventDefault();
        break;

      case 'Escape':
        this.isOpen = false;
        event.preventDefault();
        break;
    }
  }
  private destroyRef = inject(DestroyRef);
  private el = inject(ElementRef)
  private cdk = inject(ChangeDetectorRef)

  public isOpen = false;
  public searchControl = new FormControl('');
  public flatItems: FlatItem[] = []
  public activeIndex: number = -1
  public filteredItems: DropdownItem[] = []
  public filteredGroups: DropdownGroup[] = []

  ngOnInit(): void {
    if (this.mode === 'multi' && this.items.length) {
      this.selectedValues = [...this.selectedValues]
    } else if (this.mode === 'single' && this.selectedValues.length > 1) {
      this.selectedValues = [this.selectedValues[0]]
    }
    this.cdk.markForCheck()
    this.change.emit([...this.selectedValues])

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(''),
      map(term => this.filterItems(term)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => {
      this.filteredItems = items
      this.flatItems = items
      this.activeIndex = items.length ? 0 : -1
      this.cdk.markForCheck()
    })

    if (this.groups.length) {
      const search$ = this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith('')
      )

      combineLatest([search$, this.getSelected()]).pipe(
        map(([term, selectedDistricts]) => this.filterGroups(term, selectedDistricts)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(groups => {
        this.filteredGroups = groups
        this.flatItems = groups.flatMap(group =>
          group.items.map(item => ({
            ...item,
            disabled: group.disabled
          }))
        );
        this.setInitialActiveIndex()
        this.cdk.markForCheck()
      })
    }
  }

  get activeItemId(): string | null {
    const item = this.flatItems[this.activeIndex];
    return item ? `option-${item.value}` : null;
  }

  private getSelected(): Observable<string[]> {
    return this.selectedInput$ ?? of([])
  }
  private moveActiveIndex(step: 1 | -1) {
    const items = this.flatItems;
    const length = items.length;
    if (!length) return;

    let nextIndex = this.activeIndex;
    let safety = 0;
    do {
      nextIndex = (nextIndex + step + length) % length;
      safety++;
      if (safety > length) return;
    } while (items[nextIndex].disabled);

    this.activeIndex = nextIndex;
  }

  private filterItems(term: string | null): DropdownItem[] {
    const t = (term || '').toLowerCase();
    return !t ? [...this.items] : this.items.filter(i => i.label.toLowerCase().includes(t));
  }

  private setInitialActiveIndex(): void {
    const firstEnabled = this.flatItems.findIndex(item => !item.disabled)
    this.activeIndex = firstEnabled >= 0 ? firstEnabled : -1
  }

  private filterGroups(term: string | null, selectedDistricts: string[]): DropdownGroup[] {
    const t = (term || '').toLowerCase();
    return this.groups
      .map(group => ({
        ...group,
        disabled: this.isIncludesGroup(selectedDistricts, group.value),
        items: t ? this.filterGroupItems(group.items, t) : [...group.items]
      }))
      .filter(group => group.items.length);
  }

  private isIncludesGroup(selectedDistricts: string[], val: string): boolean {
    return !selectedDistricts.includes(val)
  }


  private filterGroupItems(items: DropdownItem[], term: string): DropdownItem[] {
    return items.filter(item => item.label.toLowerCase().includes(term));
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchControl.setValue('');
      this.setInitialActiveIndex()
      
    }
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
