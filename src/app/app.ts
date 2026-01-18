import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {


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

  ngOnInit(): void {
    this.initSelectedDistricts()
  }
  public onChangeDistricts(districts: string[]) {
    this.selectedDistricts = districts
    this.selectedDistricts$.next(districts)
  }

  private initSelectedDistricts(): void {
    const allDistricts = this.districts.map(dis => dis.value)
    this.selectedDistricts = allDistricts
    this.selectedDistricts$.next(allDistricts)
  }

  private isIncludes(dis: DropdownItem): boolean {
    return !this.selectedDistricts.includes(dis.value)
  }

  private filterGroupItems(dis: DropdownItem): DropdownItem[] {
    return this.areas.filter(area => area.district === dis.value)
      .map(area => ({ label: area.label, value: area.value }))
  }
}
