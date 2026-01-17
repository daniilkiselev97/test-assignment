import { Component } from '@angular/core';
import { Dropdown } from './dropdown/dropdown';
import { JsonPipe } from '@angular/common';
import { districts, areas } from './data';
import { DropdownGroup, DropdownItem } from './models/dropdown.model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Dropdown, JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  public selectedDistricts: string[] = [];
  public selectedAreas: string[] = [];

  public selectedDistricts$ = new BehaviorSubject<string[]>([])

  readonly districts = districts;
  readonly areas = areas;

  get areaGroups(): DropdownGroup[] {
    return this.districts.map(dis => ({
      label: dis.label,
      value: dis.value,
      disabled: this.isIncludes(dis),
      items: this.filterGroupItems(dis)
    }));
  }
  public onChangeDistricts(districts: string[]) {
    this.selectedDistricts = districts
    this.selectedDistricts$.next(districts)
  }

  private isIncludes(dis: DropdownItem): boolean {
    return !this.selectedDistricts.includes(dis.value)
  }

  private filterGroupItems(dis: DropdownItem): DropdownItem[] {
    return this.areas.filter(area => area.district === dis.value)
      .map(area => ({ label: area.label, value: area.value }))
  }
}
