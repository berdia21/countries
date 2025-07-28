import { Component, OnInit } from "@angular/core";
import { FootprintService } from "../services/footprint.service";
import { CountryEmissionsForYear, TopCountry } from "../typings/Country";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  constructor(
    private footprintService: FootprintService,
  ) { }

  ngOnInit() {
    this.getCountryIds();
  }

  year!: number;
  allCountriesData: CountryEmissionsForYear[] = [];
  topCountries: TopCountry[] = [];
  intervalId: any;
  maxCarbonValue: number = 0;
  biggestYear!: number;

  private getCountryIds() {
    const countryCodes: string[] = [];
    this.footprintService.getCountries().subscribe(countries => {
      countries.forEach(({ countryCode }) => {
        countryCodes.push(countryCode);
      });

      this.fetchCountriesWithInterval(countryCodes);
    });
  }

  fetchCountriesWithInterval(strings: string[]) {
    let index = 0;

    let interval = setInterval(() => {
      if (index < strings.length) {
        this.footprintService.getCountry(strings[index]).subscribe(country => {
          this.allCountriesData.push(...country);
        });
        index++;
      } else {
        clearInterval(interval);
        this.setTopCountries()
      }
    }, 100);
  }

  private setYear() {
    const lowestYear = Math.min(...this.allCountriesData.map(c => c.year));
    this.biggestYear = Math.max(...this.allCountriesData.map(c => c.year));
    this.year = lowestYear;
  }

  private setTopCountries() {
    this.setYear();
    this.intervalId = setInterval(() => {
      if (this.year < this.biggestYear) {
        this.year++;
      } else {
        clearInterval(this.intervalId);
      }

      const countriesByCode = new Map<string, TopCountry>();

      this.allCountriesData.forEach(country => {
        if (country.year === this.year && country.carbon > 0) {
          const countryCode = country.countryCode.toString();

          if (!countriesByCode.has(countryCode)) {
            countriesByCode.set(countryCode, {
              countryName: country.countryName,
              countryCode: countryCode,
              carbon: country.carbon
            });
          }
        }
      });

      const countriesBythisYear = Array.from(countriesByCode.values());
      this.maxCarbonValue = Math.max(...countriesBythisYear.map(c => c.carbon));
      this.topCountries = countriesBythisYear.sort((a, b) => b.carbon - a.carbon).slice(0, 10);
    }, 1000);
  }

  getProgressPercentage(carbonValue: number): number {
    return this.maxCarbonValue > 0 ? (carbonValue / this.maxCarbonValue) * 100 : 0;
  }
}