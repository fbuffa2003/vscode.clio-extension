import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlTableComponent } from './sql-table.component';

describe('SqlTableComponent', () => {
  let component: SqlTableComponent;
  let fixture: ComponentFixture<SqlTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SqlTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SqlTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
