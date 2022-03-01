import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Cartao } from '../cartao.model';
import { CartaoService } from '../cartao.service';
import { ConfirmModalService } from 'src/app/shared/confirm-modal/confirm-modal.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs/operators';
import { AlertModalService } from 'src/app/shared/alert-modal/alert-modal.service';
import { ErrorModalService } from 'src/app/shared/error-modal/error-modal.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-cartao-lista',
  templateUrl: './cartao-lista.component.html',
  styleUrls: ['./cartao-lista.component.scss']
})
export class CartaoListaComponent implements OnInit {

  cartao!: Cartao[];
  displayedColumns: string[] = ['nome', 'bandeira', 'numero', 'limite', 'acoes'];
  dataSource!: Cartao[];
  carregando = false;
  filtroFormulario!: FormGroup;
  bandeiras = ['Visa', 'Mastercard', 'American Express', 'JCB', 'Diners Club', 'Aura', 'Hipercard'];

  constructor(
    private cartaoService: CartaoService,
    private router: Router,
    private dialogService: ConfirmModalService,
    private spinner: NgxSpinnerService,
    private alertService: AlertModalService,
    private erroService: ErrorModalService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.filtroFormulario = this.formBuilder.group({ //Criaando o formulário
      nome: [''],
      bandeiras: [''],
    });

    this.route.queryParams.subscribe(filtro => {
      if(filtro) {
        this.filtroFormulario.patchValue({
          nome: filtro?.nome,
          bandeiras: filtro?.bandeiras
        });
      }
    })

    this.listar();
  }

  inserir(){
    this.router.navigate([`cartao/inserir`], { queryParamsHandling: 'preserve' });
  }

  editar(id: number){
    this.router.navigate([`cartao/${id}`], { queryParamsHandling: 'preserve' });
  }

  listar(){

    let filtro = this.filtroFormulario?.getRawValue();

    this.carregando = true;
    this.spinner.show();

    this.cartaoService.listar(filtro).pipe(finalize(() => {
      this.spinner.hide();
      this.anexarConculta();
      this.carregando = false;
    })).subscribe(result => {
      this.cartao = result;
      this.dataSource = result;
    },
    error => {
      this.erroService.showError(error?.error?.message || 'Falha na conexão');
    });
  }

  excluir(id: number){
    this.dialogService.showConfirm('Deseja realmente excluir esse cartão?').subscribe(result => {
      if (result) {
        this.cartaoService.excluir(id).subscribe(() => {
          this.listar();
          this.alertService.showAlertSuccess('Cartão excluído com sucesso!');
        },
        error => {
          this.erroService.showError(error?.error?.message || 'Falha na conexão');
        });
      }
    })
  }

  limparBotoes(valor: string) {
    this.filtroFormulario.get(valor)?.setValue('');
  }

  anexarConculta() {
    const bandeiras = this.filtroFormulario.get('bandeiras')?.value || null
    this.router.navigate([''], {
      queryParams: {
        nome: this.filtroFormulario.get('nome')?.value || null,
        bandeiras: bandeiras,
      }
    });
  }

}
