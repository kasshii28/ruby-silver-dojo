import { startKeyboard } from './keyboard';
import { startRouter } from './router';
import { renderHome } from './views/home';
import { renderQuiz } from './views/quiz';
import { renderResult } from './views/result';

startKeyboard();
startRouter({ home: renderHome, quiz: renderQuiz, result: (r) => renderResult(r) });
