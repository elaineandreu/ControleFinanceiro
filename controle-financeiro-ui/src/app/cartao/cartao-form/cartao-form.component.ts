import { CartaoService } from './../cartao.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Cartao } from '../cartao.model';
import { AlertModalService } from 'src/app/shared/alert-modal/alert-modal.service';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-cartao-form',
  templateUrl: './cartao-form.component.html',
  styleUrls: ['./cartao-form.component.scss']
})
export class CartaoFormComponent implements OnInit {

  //Declaração de variáveis
  cartaoFormulario!: FormGroup;
  id!: number;
  cartao!: Cartao;
  editar = false;
  carregando = false;

  get propriedade() {
    return this.cartaoFormulario.controls;
  }

  constructor(
    private formBuilder: FormBuilder, //Instaciando o fomulário
    private cartaoService: CartaoService,
    private route: ActivatedRoute, //Através da url podemos pegar/passar variáveis. Ex.: pegar o id para editar
    private router: Router,
    private alertService: AlertModalService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.cartaoFormulario = this.formBuilder.group({ //Criaando o formulário
      nome: ['', [Validators.required, Validators.minLength(3)]],
      bandeira: ['', [Validators.required, Validators.minLength(3)]],
      numero: ['', [Validators.required, Validators.minLength(13)]],
      limite: ['', Validators.required, this.validarLimite]
    });

    this.route.params.subscribe(value => { //subscribe é usado para receber algo que é retornado por um observable
      if (value?.id) {
        this.id = value.id;
        this.editar = true;
        this.carregando = true;
        this.spinner.show();
        this.cartaoService.retornarCartaoId(this.id).pipe(finalize(() => {
          this.spinner.hide();
          this.carregando = false;
        })).subscribe( result => {
          this.cartao = result;
          this.preencherFormulario();
        });
      }
    });
  }

  //Validação assíncrona
  async validarLimite(formControl: FormControl) {
    //Exemplo de operador ternário
    return formControl.value <= 0 ? { limiteInvalido: true } : null;

    /*
    if (formControl.value <= 0) {
      return {limiteInvalido: true}
    }
    return null;
    */
  }

  enviarFormulario() {
    if (this.cartaoFormulario.invalid) {
      this.cartaoFormulario.markAllAsTouched();
    }else{
      let cartao = this.cartaoFormulario.getRawValue();

      cartao.limite = cartao.limite.replace('/[^0-9]/g', '');
      cartao.limite = cartao.limite.replace('.', '')
      cartao.limite = Number(cartao.limite.replace(',', '.'));

      if (this.editar) {
        this.cartaoService.editar(this.id, cartao).subscribe(() => {
          this.router.navigate(['/listar']);
          this.alertService.showAlertSuccess('Cartão cadastrado com sucesso');
        });
      } else {
        this.cartaoService.inserir(cartao).subscribe(() => {
          this.router.navigate(['/listar']);
          this.alertService.showAlertSuccess('Cartão editado com sucesso');
        });
      }
    }
  }

  limparBotoes(valor: string) {
    this.cartaoFormulario.get(valor)?.setValue('');
  }

  preencherFormulario(){
    this.cartaoFormulario.patchValue({ //Passando os valores para o formulário
      nome: this.cartao.nome,
      bandeira: this.cartao.bandeira,
      numero: this.cartao.numero,
      limite: Number(this.cartao.limite).toLocaleString('pt-BR', { minimumFractionDigits: 2})
    })
  }
}
