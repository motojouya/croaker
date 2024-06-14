// TODO 内部でhttp status 400, 500を扱えるようにしているが、実際のところ、それぞれの処理の中で、ちゃんとエラーをハンドリングするほうがいいかもしれない。要検討。
export const getExecuter = (func) => {
  return async (...args: ArgType<typeof func>) => { // 実際には、context => args => returnなので、もっと違った感じのはず
    try {
      const result = await bindContext(func)(...args);
      if (result instanceof Error) {
        return SomeError; // TODO 400を返すような値
      }
      return result;
    } catch (e) {
      console.log(e);
      return SomeError; // TODO 500を返すような値
    }
  };
};
