const { separarBlocos } = require("./src/utils");
const str = "O prazo para entrega do cartão de débito é de até 10 dias úteis.Se você não recebeu dentro desse período entre em contato com o Fone Fácil ou com sua Agência pra saber se o cartão está lá.[block delay=3]🔔 Lembre-se de que é importante manter seus dados cadastrais atualizados para garantir que o cartão seja entregue no endereço correto.[block delay=3]"
const resp = separarBlocos(str)
console.log(resp)