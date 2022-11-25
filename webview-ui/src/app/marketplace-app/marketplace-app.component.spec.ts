import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketplaceAppComponent } from './marketplace-app.component';

describe('MarketplaceAppComponent', () => {
  let component: MarketplaceAppComponent;
  let fixture: ComponentFixture<MarketplaceAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarketplaceAppComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketplaceAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
