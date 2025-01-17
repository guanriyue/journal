const delay = (wait: number) => new Promise(resolve => setTimeout(resolve, wait))

export const searchRandomUser = async (seed: string): Promise<{ results: RandomUser[] }> => {
  await delay(2000);

  const url = new URL(`https://randomuser.me/api/`);

  url.searchParams.set('results', '10');
  url.searchParams.set('seed', seed);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
};

interface RandomUser {
  gender: string;
  name: {
    title: string;
    first: string;
    last: string;
  };
  location: {
    street: {
      number: number;
      name: string;
    };
    city: string;
    state: string;
    country: string;
    postcode: number;
    coordinates: {
      latitude: string;
      longitude: string;
    };
    timezone: {
      offset: string;
      description: string;
    };
  };
  email: string;

  login: {
    uuid: string;
    username: string;
    password: string;
    salt: string;
    md5: string;
    sha1: string;
    sha256: string;
  };
  dob: {
    date: string;
    age: number;
  };
  registered: {
    date: string;
    age: number;
  };
  phone: string;
  cell: string;
  id: {
    name: string;
    value: string;
  };
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
  nat: string;
}
