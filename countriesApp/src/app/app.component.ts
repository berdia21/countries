import { Component, OnInit } from "@angular/core";
import { FootprintService } from "../services/footprint.service";
import { Country, CountryEmissionsForYear, TopCountry } from "../typings/Country";

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

  year: number = 1961;
  yearHasSet: boolean = false;
  countries: Country[] = [];
  allCountriesData: CountryEmissionsForYear[] = [];
  topCountries: TopCountry[] = [];
  intervalId: any;
  Math = Math;
  maxCarbonValue: number = 0;

  private getCountryIds() {
    const countryCodes: string[] = [];
    this.footprintService.getCountries().subscribe(countries => {
      this.countries = countries;
      countries.forEach(({ countryCode }) => {
        countryCodes.push(countryCode);
      });

      this.fetchCountriesWithInterval(countryCodes);
    });
  }

  fetchCountriesWithInterval(strings: string[]) {
    let index = 0;

    this.intervalId = setInterval(() => {
      if (index < strings.length) {
        this.footprintService.getCountry(strings[index]).subscribe(country => {
          this.allCountriesData.push(...country);

          if (index > 20) {
            // we can use this function to get year from countries data
            // this.setYear();
            this.setTopCountries();
          }

        });
        index++;
      } else {
        clearInterval(this.intervalId);
      }
    }, 500);
  }

  private setYear() {
    const lowestYear = Math.min(...this.allCountriesData.map(c => c.year));
    const biggestYear = Math.max(...this.allCountriesData.map(c => c.year));

    if (!this.yearHasSet) {
      this.year = lowestYear;
      this.yearHasSet = true;
    }
    if (this.year < biggestYear) {
      this.year++;
    } else {
      clearInterval(this.intervalId);
    }
  }

  private setTopCountries() {
    // update year if we do not use setYear function
    if (this.year < 2025) {
      this.year++;
    } else {
      clearInterval(this.intervalId);
      return
    }

    let countriesBythisYear: TopCountry[] = [];

    this.allCountriesData.forEach((country, index) => {
      if (country.year === this.year && country.carbon > 0) {
        countriesBythisYear.push({
          countryName: country.countryName,
          countryCode: country.countryCode.toString(),
          carbon: country.carbon
        })
      }
    });

    this.maxCarbonValue = Math.max(...countriesBythisYear.map(c => c.carbon));
    this.topCountries = countriesBythisYear.sort((a, b) => b.carbon - a.carbon).slice(0, 10);
  }
}