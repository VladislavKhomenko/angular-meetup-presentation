import{b as e,o as i,w as u,g as l,i as t,ad as s,v as m,x as p,T as r}from"./modules/vue-BOt6Q5Me.js";import{_ as d,a as c,b as f}from"./image.vue_vue_type_script_setup_true_lang-D_0DQgDB.js";import{u as g,f as _}from"./slidev/context-DfdWMxyi.js";import"./index-wg4bECKk.js";import"./modules/shiki-D84VB3Oy.js";const C={__name:"slides.md__slidev_31",setup(x){const{$clicksContext:o,$frontmatter:a}=g();return o.setup(),(v,n)=>(i(),e(f,m(p(r(_)(r(a),30))),{default:u(()=>[n[0]||(n[0]=l("div",{class:"flex justify-between items-start mb-6"},[l("img",{src:d,class:"h-15",alt:"Левое изображение"}),l("img",{src:c,class:"h-10",alt:"Правое изображение"})],-1)),n[1]||(n[1]=l("h1",null,"Лучшие практики",-1)),n[2]||(n[2]=l("div",{class:"grid grid-cols-2 gap-6"},[l("div",null,[l("h2",null,"✅ Что делать"),l("ol",null,[l("li",null,[l("strong",null,"Используйте декораторы"),s(" - @Type, @Expose, @Transform")]),l("li",null,[l("strong",null,"Создавайте кастомные декораторы"),s(" - MapTo, MapListTo")]),l("li",null,[l("strong",null,"Тестируйте преобразования"),s(" - unit тесты для моделей")]),l("li",null,[l("strong",null,"Используйте геттеры"),s(" - для вычисляемых свойств")])])]),l("div",null,[l("h2",null,"❌ Чего избегать"),l("ol",null,[l("li",null,[l("strong",null,"Ручное преобразование"),s(" - используйте class-transformer")]),l("li",null,[l("strong",null,"any типы"),s(" - строгая типизация везде")]),l("li",null,[l("strong",null,"Дублирование кода"),s(" - переиспользуйте декораторы")]),l("li",null,[l("strong",null,"Игнорирование ошибок"),s(" - обрабатывайте исключения")])])])],-1)),t(`
Дайте практические рекомендации по использованию class-transformer.
Основано на реальном production опыте в TypeScript проектах.
`),t(` # Производительность

<div class="mt-4 p-3 bg-yellow-100 rounded-lg text-sm">

## Метрики (примерные):
- **Размер бандла**: +15KB (class-transformer)
- **Время преобразования**: ~1ms на 100 объектов
- **Память**: минимальное влияние
- **TypeScript**: полная поддержка

</div> `)]),_:1},16))}};export{C as default};
